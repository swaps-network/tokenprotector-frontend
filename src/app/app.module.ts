import {BrowserModule, makeStateKey, StateKey, TransferState} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';

import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {TranslateModule, TranslateLoader, TranslateService} from '@ngx-translate/core';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './index/header/header.component';
import { StartFormComponent } from './index/start-form/start-form.component';
import { IndexComponent } from './index/index.component';
import {HttpClient, HttpClientModule, HttpClientXsrfModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ContractEditResolver, ContractFormComponent} from './contract-form/contract-form.component';
import {MatNativeDateModule, MatDatepickerModule, MAT_DATE_FORMATS, MatDialogModule, MatButtonModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import { EthAddressDirective } from './directives/eth-address/eth-address.directive';
import {EtherscanUrlPipe, EthTokenValidatorDirective} from './services/web3/web3.service';
import {UserService} from './services/user/user.service';
import {UserInterface} from './services/user/user.interface';
import {AuthComponent} from './common/auth/auth.component';
import {AuthenticationComponent} from './common/auth/authentication/authentication.component';
import {RegistrationComponent} from './common/auth/registration/registration.component';
import {SocialComponent} from './common/auth/social/social.component';
import {EmailConfirmComponent} from './common/auth/email-confirm/email-confirm.component';
import {ForgotPasswordComponent} from './common/auth/forgot-password/forgot-password.component';
import { ContractFormPayComponent } from './contract-form/contract-form-pay/contract-form-pay.component';
import { ContractPreviewComponent } from './contract-preview/contract-preview.component';
import { TransactionComponent } from './transaction/transaction.component';
import {ContractsListComponent, ContractsListResolver} from './contracts-list/contracts-list.component';
import { FooterComponent } from './footer/footer.component';
import { PublicContractsComponent } from './index/public-contracts/public-contracts.component';
import {ClipboardModule} from 'ngx-clipboard';
import {BigNumberDirective, BigNumberFormat, BigNumberMax, BigNumberMin} from './directives/big-number/big-number.directive';
import { ContactOwnerComponent } from './contact-owner/contact-owner.component';
import { TeamComponent } from './team-component/team.component';
import { RoadmapComponent } from './roadmap-component/roadmap.component';
import { FaqComponent } from './faq-component/faq.component';
import {MinMaxDirective} from './directives/minMax/min-max.directive';
import { CookieService } from 'ngx-cookie-service';
import { ContactsComponent } from './contacts-component/contacts.component';
import { TokensAllInputComponent } from './directives/tokens-all-input/tokens-all-input.component';
import {HttpService} from './services/http/http.service';
import {ContractEditV3Resolver, ContractFormAllComponent, ContractEditResolver2} from './contract-form-all/contract-form-all.component';
import { ContractsPreviewV3Component } from './contracts-preview-v3/contracts-preview-v3.component';
import { IndexIcoComponent } from './index-ico/index-ico.component';
import { IndexIcoHeaderComponent } from './index-ico/index-ico-header/index-ico-header.component';
import { IndexIcoFormComponent } from './index-ico/index-ico-form/index-ico-form.component';
import {OwlModule} from 'ngx-owl-carousel';
import {Observable} from 'rxjs';
import {TransferHttpCacheModule} from '@nguniversal/common';
import { CoinsListComponent } from './directives/coins-list/coins-list.component';
import { ChangePasswordComponent } from './common/change-password/change-password.component';
import { KeepInTouchComponent } from './footer/keep-in-touch/keep-in-touch.component';


export class TranslateBrowserLoader implements TranslateLoader {

  constructor(private prefix: string = 'i18n',
              private suffix: string = '.json',
              private transferState: TransferState,
              private http: HttpClient) {

  }

  public getTranslation(lang: string): Observable<any> {

    const key: StateKey<number> = makeStateKey<number>('transfer-translate-' + lang);
    const data = this.transferState.get(key, null);

    // First we are looking for the translations in transfer-state, if none found, http load as fallback
    if (data) {
      return Observable.create(observer => {
        observer.next(data);
        observer.complete();
      });
    } else {
      return new TranslateHttpLoader(this.http, this.prefix, this.suffix).getTranslation(lang);
    }
  }
}


export function exportTranslateStaticLoader(http: HttpClient, transferState: TransferState) {
  return new TranslateBrowserLoader('./assets/i18n/', '.json?_t=' + (new Date).getTime(), transferState, http);
}



export function appInitializerFactory(translate: TranslateService, userService: UserService, httpService: HttpService) {

  const defaultLng = (navigator.language || navigator['browserLanguage']).split('-')[0];

  const langToSet = window['jQuery']['cookie']('lng') || ((['en', 'zh', 'ko', 'ru'].indexOf(defaultLng) > -1) ? defaultLng : 'en');

  return () => new Promise<any>((resolve: any, reject) => {

    translate.setDefaultLang('en');

    translate.use(langToSet).subscribe(() => {
      const subscriber = userService.getCurrentUser(true).subscribe((user: UserInterface) => {

        httpService.get('get_coinmarketcap_tokens/').toPromise().then((tokens) => {

          tokens = tokens.sort((a, b) => {
            const aRank = a.rank || 100000;
            const bRank = b.rank || 100000;
            return aRank > bRank ? 1 : aRank < bRank ? -1 : 0;
          });

          tokens.forEach((token) => {
            token.platform = (token.platform !== 'False') ? token.platform : false;
            if (!token.platform && (token.token_short_name === 'ETH') && (token.token_name === 'Ethereum')) {
              token.platform = 'ethereum';
              token.isEther = true;
            }
            token.platform = token.platform || token.token_name.toLowerCase();
            token.isEthereum = !!((token.platform === 'ethereum') && (token.address));

            if (token.platform !== 'fiat') {
              token.decimals = 8;
            } else {
              token.decimals = 2;
              token.address = token.token_short_name;
            }


          });
          window['cmc_tokens'] = tokens;
          resolve(null);
        });

        subscriber.unsubscribe();
      });
    });

  });
}




@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    StartFormComponent,
    IndexComponent,
    ContractFormComponent,
    EthAddressDirective,
    EthTokenValidatorDirective,
    RegistrationComponent,
    AuthComponent,
    AuthenticationComponent,
    SocialComponent,
    EmailConfirmComponent,
    ForgotPasswordComponent,
    ContractFormPayComponent,
    ContractPreviewComponent,
    TransactionComponent,
    ContractsListComponent,
    EtherscanUrlPipe,
    FooterComponent,
    BigNumberFormat,
    BigNumberMin,
    BigNumberMax,
    PublicContractsComponent,
    BigNumberDirective,

    MinMaxDirective,
    ContactOwnerComponent,
    TeamComponent,
    RoadmapComponent,
    FaqComponent,
    ContactsComponent,
    TokensAllInputComponent,
    ContractFormAllComponent,
    ContractsPreviewV3Component,
    IndexIcoComponent,
    IndexIcoHeaderComponent,
    IndexIcoFormComponent,
    CoinsListComponent,
    ChangePasswordComponent,
    KeepInTouchComponent
  ],
  entryComponents: [
    AuthComponent,
    TransactionComponent,
    ContactOwnerComponent,
    IndexIcoFormComponent,
    ChangePasswordComponent
  ],
  imports: [
    TransferHttpCacheModule,
    TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: exportTranslateStaticLoader,
          deps: [HttpClient, TransferState]
        }
      }
    ),

    HttpClientXsrfModule.withOptions({
      cookieName: 'csrftoken',
      headerName: 'X-CSRFToken'
    }),
    MatDialogModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatButtonModule,
    BrowserAnimationsModule,
    NgxMaterialTimepickerModule,
    ClipboardModule,
    OwlModule
  ],
  providers: [
    CookieService,
    ContractEditResolver,
    ContractsListResolver,
    ContractEditV3Resolver,
    ContractEditResolver2,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [
        TranslateService, UserService, HttpService
      ],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
