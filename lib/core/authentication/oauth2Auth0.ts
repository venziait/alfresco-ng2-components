/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as ee from 'event-emitter';
import { AlfrescoApiConfig, AuthenticationApi, AlfrescoApi, Oauth2Auth } from '@alfresco/js-api';
import * as _minimatch from 'minimatch';
import { Authentication } from '@alfresco/js-api/src/authentication/authentication';
import { Auth0Service } from './auth0.service';
import { EventEmitter } from '@angular/core';

const minimatch = _minimatch;

declare let window: Window;

export class Oauth2Auth0 extends Oauth2Auth {

    hashFragmentParams: any;
    token: string;
    discovery: any = {};

    authentications: Authentication = {
        'oauth2': { accessToken: '' }, type: 'oauth2', 'basicAuth': {}
    };

    iFrameHashListener: any;
    auth0Service: Auth0Service;

    constructor(config: AlfrescoApiConfig, alfrescoApi: AlfrescoApi, auth0Service: Auth0Service) {
        super(config, alfrescoApi);
        this.auth0Service = auth0Service;
        this.className = 'Oauth2Auth';

        if (config) {
            this.setConfig(config, alfrescoApi);
        }
    }

    setConfig(config: AlfrescoApiConfig, alfrescoApi: AlfrescoApi) {
        this.config = config;

        if (this.config.oauth2) {
            if (this.config.oauth2.host === undefined || this.config.oauth2.host === null) {
                throw new Error('Missing the required oauth2 host parameter');
            }

            if (this.config.oauth2.clientId === undefined || this.config.oauth2.clientId === null) {
                throw new Error('Missing the required oauth2 clientId parameter');
            }

            if (this.config.oauth2.scope === undefined || this.config.oauth2.scope === null) {
                throw new Error('Missing the required oauth2 scope parameter');
            }

            if (this.config.oauth2.secret === undefined || this.config.oauth2.secret === null) {
                this.config.oauth2.secret = '';
            }

            if ((this.config.oauth2.redirectUri === undefined || this.config.oauth2.redirectUri === null) && this.config.oauth2.implicitFlow) {
                throw new Error('Missing redirectUri required parameter');
            }

            if (!this.config.oauth2.refreshTokenTimeout) {
                this.config.oauth2.refreshTokenTimeout = 30000;
            }

            if (!this.config.oauth2.redirectSilentIframeUri) {
                let context = '';
                if (typeof window !== 'undefined') {
                    context = window.location.origin;
                }
                this.config.oauth2.redirectSilentIframeUri = context + '/assets/silent-refresh.html';
            }

            this.basePath = this.config.oauth2.host; // Auth Call

            this.host = this.config.oauth2.host;

            // this.discoveryUrls();

            if (this.hasContentProvider()) {
                this.exchangeTicketListener(alfrescoApi);
            }

            //  this.initOauth(); // jshint ignore:line
        }
    }

    async initOauth() {
        if (!this.config.oauth2.implicitFlow && this.isValidAccessToken()) {
            const accessToken = this.storage.getItem('access_token');
            this.setToken(accessToken, null);
        }

        if (this.config.oauth2.implicitFlow) {
            await this.checkFragment();
        }
    }

    discoveryUrls() {
        this.discovery.loginUrl = `${this.host}/oauth2/authorize`;
        this.discovery.logoutUrl = `${this.host}/oauth2/revoke`;
        this.discovery.tokenEndpoint = `${this.host}/oauth2/token`;
    }

    hasContentProvider(): boolean {
        return this.config.provider === 'ECM' || this.config.provider === 'ALL';
    }

    checkFragment(externalHash?: any): any {// jshint ignore:line
        this.hashFragmentParams = this.getHashFragmentParams(externalHash);

        if (externalHash === undefined && this.isValidAccessToken()) {
            const accessToken = this.storage.getItem('access_token');
            this.setToken(accessToken, null);
            this.silentRefresh();
            return accessToken;
        }

        if (this.hashFragmentParams) {
            const accessToken = this.hashFragmentParams.access_token;
            const idToken = this.hashFragmentParams.id_token;
            const sessionState = this.hashFragmentParams.session_state;
            const expiresIn = this.hashFragmentParams.expires_in;

            if (!sessionState) {
                throw new Error(('session state not present'));
            }

            const jwt = this.processJWTToken(idToken);
            try {
                if (jwt) {
                    this.storeIdToken(idToken, jwt.payload.exp);
                    this.storeAccessToken(accessToken, expiresIn);
                    this.authentications.basicAuth.username = jwt.payload.preferred_username;
                    this.saveUsername(jwt.payload.preferred_username);
                    this.silentRefresh();
                    return accessToken;
                }
            } catch (error) {
                throw new Error(('Validation JWT error' + error));
            }

        } else {
            if (this.config.oauth2.silentLogin && !this.isPublicUrl()) {
                this.implicitLogin();
            }
        }

    }

    isPublicUrl(): boolean {
        const publicUrls = this.config.oauth2.publicUrls || [];

        if (Array.isArray(publicUrls)) {
            return publicUrls.length &&
                publicUrls.some((urlPattern: string) => minimatch(window.location.href, urlPattern));
        }
        return false;
    }

    padBase64(base64data: any) {
        while (base64data.length % 4 !== 0) {
            base64data += '=';
        }
        return base64data;
    }

    processJWTToken(jwt: any): any {
        if (jwt) {
            const jwtArray = jwt.split('.');
            const headerBase64 = this.padBase64(jwtArray[0]);
            const headerJson = this.b64DecodeUnicode(headerBase64);
            const header = JSON.parse(headerJson);

            const payloadBase64 = this.padBase64(jwtArray[1]);
            const payloadJson = this.b64DecodeUnicode(payloadBase64);
            const payload = JSON.parse(payloadJson);

            const savedNonce = this.storage.getItem('nonce');

            if (!payload.sub) {
                throw new Error(('Missing sub in JWT'));
            }

            if (payload.nonce !== savedNonce) {
                throw new Error(('Failing nonce JWT is not corrisponding' + payload.nonce));
            }

            return {
                idToken: jwt,
                payload: payload,
                header: header
            };
        }
    }

    b64DecodeUnicode(b64string: string) {
        const base64 = b64string.replace(/\-/g, '+').replace(/\_/g, '/');
        return decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
    }

    storeIdToken(idToken: string, exp: number) {
        this.storage.setItem('id_token', idToken);
        this.storage.setItem('id_token_expires_at', Number(exp * 1000).toString());
        this.storage.setItem('id_token_stored_at', Date.now().toString());
    }

    storeAccessToken(accessToken: string, expiresIn: number, refreshToken?: string) {
        this.storage.setItem('access_token', accessToken);

        const expiresInMilliSeconds = expiresIn * 1000;
        const now = new Date();
        const expiresAt = now.getTime() + expiresInMilliSeconds;

        this.storage.setItem('access_token_expires_in', expiresAt);
        this.storage.setItem('access_token_stored_at', Date.now().toString());
        this.setToken(accessToken, refreshToken);
    }

    saveUsername(username: string) {
        if (this.storage.supportsStorage()) {
            this.storage.setItem('USERNAME', username);
        }
    }

    implicitLogin() {
        if (!this.isValidToken() || !this.isValidAccessToken()) {
            this.redirectLogin();
        } else {
            const accessToken = this.storage.getItem('access_token');
            this.setToken(accessToken, null);
        }
    }

    isValidToken(): boolean {
        let validToken = false;
        if (this.getIdToken()) {
            const expiresAt = this.storage.getItem('id_token_expires_at'),
                now = new Date();
            if (expiresAt && parseInt(expiresAt, 10) >= now.getTime()) {
                validToken = true;
            }
        }

        return validToken;
    }

    isValidAccessToken(): boolean {
        let validAccessToken = false;

        if (this.getAccessToken()) {
            const expiresAt = this.storage.getItem('access_token_expires_in');
            const now = new Date();
            if (expiresAt && parseInt(expiresAt, 10) >= now.getTime()) {
                validAccessToken = true;
            }
        }

        return validAccessToken;
    }

    getIdToken(): string {
        return this.storage.getItem('id_token');
    }

    getAccessToken(): string {
        return this.storage.getItem('access_token');
    }

    redirectLogin(): void {
        if (this.config.oauth2.implicitFlow && typeof window !== 'undefined') {
            const href = this.composeImplicitLoginUrl();
            window.location.href = href;
            this.emit('implicit_redirect', href);
        }
    }

    genNonce(): string {
        let text = '';
        const possible =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 40; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    hasHashCharacter(hash: string): boolean {
        return hash.indexOf('#') === 0;
    }

    startWithHashRoute(hash: string) {
        return hash.startsWith('#/');
    }

    getHashFragmentParams(externalHash: string): string {
        let hashFragmentParams = null;

        if (typeof window !== 'undefined') {
            let hash;

            if (!externalHash) {
                hash = decodeURIComponent(window.location.hash);
                if (!this.startWithHashRoute(hash)) {
                    window.location.hash = '';
                }
            } else {
                hash = decodeURIComponent(externalHash);
                this.removeHashFromSilentIframe();
                this.destroyIframe();
            }

            if (this.hasHashCharacter(hash) && !this.startWithHashRoute(hash)) {
                const questionMarkPosition = hash.indexOf('?');

                if (questionMarkPosition > -1) {
                    hash = hash.substr(questionMarkPosition + 1);
                } else {
                    hash = hash.substr(1);
                }
                hashFragmentParams = this.parseQueryString(hash);
            }
        }
        return hashFragmentParams;
    }

    parseQueryString(queryString: string): any {
        const data: { [key: string]: Object } = {};
        let pairs, pair, separatorIndex, escapedKey, escapedValue, key, value;

        if (queryString !== null) {
            pairs = queryString.split('&');

            for (let i = 0; i < pairs.length; i++) {
                pair = pairs[i];
                separatorIndex = pair.indexOf('=');

                if (separatorIndex === -1) {
                    escapedKey = pair;
                    escapedValue = null;
                } else {
                    escapedKey = pair.substr(0, separatorIndex);
                    escapedValue = pair.substr(separatorIndex + 1);
                }

                key = decodeURIComponent(escapedKey);
                value = decodeURIComponent(escapedValue);

                if (key.substr(0, 1) === '/') {
                    key = key.substr(1);
                }

                data[key] = value;
            }
        }

        return data;
    }

    removeHashFromSilentIframe() {
        const iframe: any = document.getElementById('silent_refresh_token_iframe');
        if (iframe && iframe.contentWindow.location.hash) {
            iframe.contentWindow.location.hash = '';
        }
    }

    /**
     * login Alfresco API
     * @returns {Promise} A promise that returns {new authentication token} if resolved and {error} if rejected.
     */
    login(username: string, password: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.grantPasswordLogin(username, password, resolve, reject);
        });
    }

    grantPasswordLogin(username: string, password: string, resolve: any, reject: any) {
        const postBody = {}, pathParams = {}, queryParams = {};

        const headerParams = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const formParams = {
            username: username,
            password: password,
            grant_type: 'password',
            client_id: this.config.oauth2.clientId
        };

        const contentTypes = ['application/x-www-form-urlencoded'];
        const accepts = ['application/json'];

        const promise = this.callCustomApi(
            this.discovery.tokenEndpoint, 'POST',
            pathParams, queryParams, headerParams, formParams, postBody,
            contentTypes, accepts
        ).then(
            (data: any) => {
                this.saveUsername(username);
                this.storeAccessToken(data.access_token, data.expires_in, data.refresh_token);
                this.silentRefresh();
                resolve(data);
            },
            (error) => {
                if (error.error && error.error.status === 401) {
                    this.emit('unauthorized');
                }
                this.emit('error');
                reject(error.error);
            });

        ee(promise); // jshint ignore:line
    }

    /**
     * Refresh the  Token
     */
    refreshToken(): Promise<any> {
        const postBody = {}, pathParams = {}, formParams = {};

        const auth = 'Basic ' + btoa(this.config.oauth2.clientId + ':' + this.config.oauth2.secret);

        const headerParams = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
            'Authorization': auth
        };

        const queryParams = {
            refresh_token: this.authentications.oauth2.refreshToken,
            grant_type: 'refresh_token'
        };

        const contentTypes = ['application/x-www-form-urlencoded'];
        const accepts = ['application/json'];

        const promise = new Promise((resolve, reject) => {
            this.callCustomApi(
                this.discovery.tokenEndpoint, 'POST',
                pathParams, queryParams, headerParams, formParams, postBody,
                contentTypes, accepts
            ).then(
                (data: any) => {
                    this.setToken(data.access_token, data.refresh_token);
                    resolve(data);
                },
                (error) => {
                    if (error.error.status === 401) {
                        this.emit('unauthorized');
                    }
                    this.emit('error');
                    reject(error.error);
                });
        });

        ee(promise); // jshint ignore:line

        return promise;
    }

    /**
     * Set the current Token
     *
     */
    setToken(token: string, refreshToken: string) {
        this.authentications.oauth2.accessToken = token;
        this.authentications.oauth2.refreshToken = refreshToken;
        this.authentications.basicAuth.password = null;
        this.token = token;

        this.emit('token_issued');
    }

    /**
     * Get the current Token
     *
     */
    getToken(): string {
        return this.token;
    }

    /**
     * return the Authentication
     *
     * @returns {Object} authentications
     */
    getAuthentication(): Authentication {
        return this.authentications;
    }

    /**
     * Change the Host
     */
    changeHost(host: string) {
        this.config.hostOauth2 = host;
    }

    /**
     * If the client is logged in return true
     *
     * @returns {Boolean} is logged in
     */
    isLoggedIn(): boolean {
        return !!this.authentications.oauth2.accessToken;
    }

    /**
     * Logout
     */

    async logOut() {
        this.auth0Service.logout();
    }

    invalidateSession() {
        this.storage.removeItem('access_token');
        this.storage.removeItem('access_token_expires_in');
        this.storage.removeItem('access_token_stored_at');

        this.storage.removeItem('id_token');
        this.storage.removeItem('id_token');
        this.storage.removeItem('id_token_claims_obj');
        this.storage.removeItem('id_token_expires_at');
        this.storage.removeItem('id_token_stored_at');

        this.storage.removeItem('nonce');
    }

    exchangeTicketListener(alfrescoApi: AlfrescoApi) {
        this.once('token_issued', async () => {
            const authContentApi: AuthenticationApi = new AuthenticationApi(alfrescoApi);
            authContentApi.apiClient.authentications = this.authentications;
            const ticketEntry = await authContentApi.getTicket();
            this.config.ticketEcm = ticketEntry.entry.id;
            this.emit('ticket_exchanged');
        });
    }
}
