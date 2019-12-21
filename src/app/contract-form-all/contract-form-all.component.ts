import {AfterContentInit, Component, EventEmitter, Injectable, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {MY_FORMATS} from '../contract-form/contract-form.component';
import {ContractsService} from '../services/contracts/contracts.service';
import {UserService} from '../services/user/user.service';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router} from '@angular/router';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDatepicker, MatDialog, MatDialogRef} from '@angular/material';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from '@angular/material-moment-adapter';
import TOKENS from './tokens';

import {HttpService} from '../services/http/http.service';
import {Web3Service} from '../services/web3/web3.service';
import {Observable} from 'rxjs';
import {UserInterface} from '../services/user/user.interface';

export interface IContractV3 {

  id?: number;
  name: string;

  base_address?: string;
  quote_address?: string;
  base_limit?: string;
  quote_limit?: string;
  stop_date?: number;
  owner_address?: string;
  public?: boolean|undefined;
  unique_link?: string;
  unique_link_url?: string;

  broker_fee: boolean;
  broker_fee_address: string;
  broker_fee_base: number;
  broker_fee_quote: number;

  quote_coin_id?: number;
  base_coin_id?: number;
  comment?: string;
  tokens_info?: {
    base?: {
      token: any;
      amount?: string;
    };
    quote?: {
      token: any;
      amount?: string;
    };
  };

  whitelist?: any;
  whitelist_address?: any;
  min_base_wei?: any;
  memo_contract?: any;
  min_quote_wei?: any;

  state?: string;
  isSwapped?: boolean;
  isAuthor?: boolean;
  user?: number;

  delail?: string;

  contract_state?: string;

  isEthereum?: boolean;
  notification?: boolean;
  notification_tg: string;
  notification_email: string;
  created_date: string;
}

export interface IReqData {
  id?: number;
  contract_type?: number;
  network: number;
  balance?: number;
  state?: string;
  name: string;
  detail?: string;
  user?: number;
  cost?: object;
  contract_details: {
    owner_address: string;
    reserve_address: string;
    end_timestamp: number;
    email: string;
  };
}

export interface IStepper {
  max: number;
  current: number;
}

export interface IError {
  status: boolean;
  message: string;
}

@Component({
  selector: 'app-contract-form-all',
  templateUrl: './contract-form-all.component.html',
  styleUrls: ['../contract-form/contract-form.component.scss'],
  providers: [
    Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ]
})

export class ContractFormAllComponent implements AfterContentInit, OnInit, OnDestroy {
  @ViewChild('contactsReminderModal') contactsReminderModal: TemplateRef<any>;
  @ViewChild('ethSwapNotification') ethSwapNotification: TemplateRef<any>;
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;

  @Output() costEmitter = new EventEmitter<any>();
  @Output() QuoteTokenCustom = new EventEmitter<any>();

  public reqData: IReqData = {
    contract_type: 23,
    network: 1,
    state: 'PREPARE',
    name: 'TokenProtector',
    contract_details: {
      owner_address: '',
      reserve_address: '',
      end_timestamp: 1,
      email: '',
    }
  };

  public stepper: IStepper = {
    max: 5,
    current: 0
  }

  public error: IError = {
    status: false,
    message: ''
  }

  public editableTokenProtector:boolean = true;
  public previewTrigger:boolean = false;
  public nextStepProcess:boolean = false;
  public userGhost:boolean = false;

  public subscriptionUser;
  public currentUser;
  public curDate;
  private checker;

  public tokens = TOKENS;
  public filteredTokens;
  public searchToken;

  private preCreateProcess: boolean = false;

  constructor(
    protected contractsService: ContractsService,
    private userService: UserService,
    private location: Location,
    private route: ActivatedRoute,
    protected router: Router,
    private dialog: MatDialog
  ) {
    this.reqData = this.route.snapshot.data.contract;
    this.currentUser = this.userService.getUserModel();
    this.userService.getCurrentUser().subscribe((userProfile: UserInterface) => {
      this.currentUser = userProfile;
    });

    this.subscriptionUser = this.userService.getCurrentUser(false, true).subscribe((user) => {
      console.log('work subscribe')
      if (user.is_ghost) {
        this.userGhost = true;
        if (this.reqData.id) {
          this.userService.openAuthForm()
            .then(() => {
              this.userGhost = false;
            }
              , () => { });
        }
      }
      else {
        this.userGhost = false;
        if (this.preCreateProcess) {
          this.nextStep(2);
        }
        if (this.reqData.id && !this.checker) {
          this.checkContractStatus();
        }
      }
    });
  }

  ngOnInit() {
    if (this.reqData) {
      this.curDate = new Date(this.reqData.contract_details.end_timestamp * 1000);
      this.checkContractStatus();
    } else {
      this.reqData = {
        contract_type: 23,
        network: 1,
        state: 'PREPARE',
        name: 'TokenProtector',
        contract_details: {
          owner_address: '',
          reserve_address: '',
          end_timestamp: 1,
          email: '',
        }
      } as IReqData;

      this.stepper = {
        max: 5,
        current: 0
      } as IStepper;
    }
  }

  ngAfterContentInit() { }
  
  ngOnDestroy() {
    if (this.checker) clearTimeout(this.checker);
  }

  public changeTokenStatus(value:string, state:boolean) {
    this.tokens.find(s => s.label === value).approved = state;
    this.filterItem(this.searchToken);
  }

  public filterItem(value) {
    if (!value) {
      this.filteredTokens = null;
    }
    else {
      this.filteredTokens = Object.assign([], this.tokens).filter(
        token => token.label.toLowerCase().indexOf(value.toLowerCase()) > -1 && token.approved === false
      );
    }
  }

  public changedToken() {
    console.log('change');
    // const baseCoin = this.requestData.tokens_info.base.token;
    // const quoteCoin = this.requestData.tokens_info.quote.token;
    // if (this.requestData.tokens_info.base.amount && this.requestData.tokens_info.quote.amount &&
    //   baseCoin.cmc_id && quoteCoin.cmc_id && baseCoin.cmc_id > 0 && quoteCoin.cmc_id > 0) {
    //   this.cmcRate = {
    //     revert: new BigNumber(baseCoin.rate).div(quoteCoin.rate).toNumber(),
    //     direct: new BigNumber(quoteCoin.rate).div(baseCoin.rate).toNumber()
    //   };
    //   const rate = parseFloat(this.getRate(true));
    //   const rateChanges = parseFloat(this.getRate()) - this.cmcRate.direct;
    //   this.cmcRate.isMessage = true;
    //   this.cmcRate.isLower = rateChanges > 0;
    //   this.cmcRate.change = Math.round(Math.abs(-((rate / this.cmcRate.revert) - 1)) * 100);
    // } else {
    //   this.cmcRate = undefined;
    // }
  }


  public nextStep(stepNumber) {

    (stepNumber <= 1) ? this.stepper.current = stepNumber : null;

    if (stepNumber === 2) {
      this.nextStepProcess = true;
      if (!this.userGhost) {
        this.contractsService.createContract(this.reqData).then((rez) => {
          this.reqData = rez;
          this.checkContractStatus();
        }).catch(err => {
          this.error.status = true;
          this.error.message = err;
        });
      }
      else {
        this.preCreateProcess = true;
        this.userService.openAuthForm()
          .then(() => {  }
            , () => { this.preCreateProcess = false; this.nextStepProcess = false;});
      }
    }
    
    if (stepNumber === 3 ) {
      this.nextStepProcess = true;
      if (!this.userGhost) {
        this.contractsService.prepareForPayment(this.reqData.id).then((rez) => {
          this.reqData = rez;
          this.checkContractStatus();
        }).catch(err => {
          this.error.status = true;
          this.error.message = err;
        });
      }
      else {
        this.openLogInForm();
      }
    }

    if (stepNumber === 4 && !this.userGhost) {
      this.nextStepProcess = true;
      if (!this.userGhost) {
        this.stepper.current = stepNumber;
        this.nextStepProcess = false;
      }
      else {
        this.openLogInForm();
      }
    } 

    (stepNumber === 5 && !this.userGhost) ? this.stepper.current = stepNumber : null;
  }

  private openLogInForm() {
    this.userService.openAuthForm()
      .then(() => { }
        , () => { this.nextStepProcess = false; });
  }

  private checkContractStatus() {

    switch (this.reqData.state) {
      case 'CREATED':
        console.log(this.reqData.state);
        window.history.pushState(this.reqData.id, "Create Contract", "/create/" + this.reqData.id);
        this.stepper.current = 2;
        this.editableTokenProtector = false;
        this.previewTrigger = true;
        this.nextStepProcess = false;
        break;
      case 'WAITING_FOR_PAYMENT':
        console.log(this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        this.stepper.current = 3;
        this.editableTokenProtector = false;
        this.previewTrigger = true;
        this.nextStepProcess = false;
        break;
      case 'WAITING_FOR_PAYMENT':
        console.log(this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        this.stepper.current = 3;
        this.editableTokenProtector = false;
        this.previewTrigger = true;
        this.nextStepProcess = false;
        break;
      case 'POSTPONED':
        console.log(this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        this.stepper.current = 4;
        this.editableTokenProtector = false;
        this.previewTrigger = true;
        this.nextStepProcess = false;
        return;
      case 'WAITING_FOR_DEPLOYMENT':
        console.log(this.reqData.state);
        this.stepper.current = 4;
        this.editableTokenProtector = false;
        this.previewTrigger = true;
        this.nextStepProcess = false;
        break;
      case 'ACTIVE':
        this.stepper.current = 5;
        this.editableTokenProtector = false;
        this.previewTrigger = true;
        this.nextStepProcess = false;
        break;
      default:
        console.log(this.reqData.state);
        break;
    }
    if (!this.userGhost)
      this.checker = setTimeout(() => { this.getContractInformation() }, 5000);
    else this.checker = undefined;
  }

  private getContractInformation() {
    let promise = this.contractsService.getContract(this.reqData.id);
    promise.then((result) => {
      this.reqData = result;
      this.checkContractStatus();
    });
  };

  public dateChange() {this.reqData.contract_details.end_timestamp = Math.floor(this.curDate / 1000);}
}

@Injectable()
export class ContractEditResolver2 implements Resolve<any> {
  private currentUser;
  private route;

  constructor(
    private contractsService: ContractsService,
    private userService: UserService,
    private router: Router
  ) { }

  private contractId: number;

  private getContractInformation(observer) {
    let promise = this.contractsService.getContract(this.contractId);
    promise.then((result) => {
      observer.next(result);
      observer.complete();
    });
  };

  resolve(route: ActivatedRouteSnapshot) {
    this.route = route;

    if (route.params.id) {
      this.contractId = route.params.id;
      
      return new Observable((observer) => {
        const subscription = this.userService.getCurrentUser(false, true).subscribe((user) => {
          this.currentUser = user;
          if (!user.is_ghost) this.getContractInformation(observer);
          else {
            this.userService.openAuthForm()
              .then(() => { this.getContractInformation(observer); }
                , () => { this.router.navigate(['/create']); });
          }
          subscription.unsubscribe();
        });
        return {
          unsubscribe() { }
        };
      });
    }
  }
}




@Injectable()
export class ContractEditV3Resolver implements Resolve<any> {
  private currentUser;
  private route;

  constructor(
    private contractsService: ContractsService,
    private userService: UserService,
    private httpService: HttpService,
    private web3Service: Web3Service,
    private router: Router
  ) {

  }

  private contractId: number;
  private publicLink: string;


  private getContractInformation(observer, isPublic?) {

    const promise = (!isPublic ?
      this.contractsService.getContractV3Information(this.contractId) :
      this.contractsService.getSwapByPublic(this.publicLink)) as Promise<any>;

    // promise.then((trade: IContractV3) => {
    //   this.web3Service.getSWAPSCoinInfo(trade).then((result: any) => {
    //     result.isEthereum = result.tokens_info.base.token.isEthereum && result.tokens_info.quote.token.isEthereum;
    //     observer.next(result);
    //     observer.complete();
    //   });
    // }, () => {
    //   this.router.navigate(['/trades']);
    // });

  }

  resolve(route: ActivatedRouteSnapshot) {
    this.route = route;
    if (route.params.id) {
      this.contractId = route.params.id;
      return new Observable((observer) => {
        const subscription = this.userService.getCurrentUser(false, true).subscribe((user) => {
          this.currentUser = user;
          if (!user.is_ghost) {
            this.getContractInformation(observer);
          } else {
            this.userService.openAuthForm().then(() => {
              this.getContractInformation(observer);
            }, () => {
              this.router.navigate(['/create-v3/']);
              //
            });
          }
          subscription.unsubscribe();
        });
        return {
          unsubscribe() {}
        };
      });
    } else if (route.params.public_link) {
      this.publicLink = route.params.public_link;
      return new Observable((observer) => {
        this.getContractInformation(observer, true);
      });
    }
  }
}
