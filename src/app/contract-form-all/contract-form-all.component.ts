import {AfterContentInit, Component, EventEmitter, Injectable, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {MY_FORMATS} from '../contract-form/contract-form.component';
import {ContractsService} from '../services/contracts/contracts.service';
import {UserService} from '../services/user/user.service';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router} from '@angular/router';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDatepicker, MatDialog} from '@angular/material';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { TransactionComponent } from '../transaction/transaction.component';
import BigNumber from 'bignumber.js';

import {HttpService} from '../services/http/http.service';
import {Web3Service} from '../services/web3/web3.service';
import {Observable} from 'rxjs';
import { UserInterface } from '../services/user/user.interface';
import {ERC20_TOKEN_ABI} from '../services/web3/web3.constants';

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
    approved_tokens?: any;
    eth_contract?: any;
  };
}

export interface IStepper {
  max: number;
  current: number;
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

  public confirmErrorMessage:string = '';

  public editableTokenProtector:boolean = true;
  public previewTrigger:boolean = false;
  public nextStepProcess:boolean = false;
  public curDate;
  public minDate;

  public subscriptionUser;
  public currentUser;
  private checker;
  public filterTokensLimit: number = 10;
  public copiedAddresses = {};

  public tokens;
  public searchToken;
  public selectedToken: any;
  private contactEdited: boolean = false;
  public confirmStatus: boolean = false;
  
  public tokensApproved = [];
  public savedApprovedTokens:any = [];
  public popular = ["0x36d10c6800d569bb8c4fe284a05ffe3b752f972c","0x006bea43baa3f7a6f765f14f10a1a1b08334ef45","0x03c780cd554598592b97b7256ddaad759945b125","0x01cc4151fe5f00efb8df2f90ff833725d3a482a3","0x8810c63470d38639954c6b41aac545848c46484a","0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650","0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4","0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D"];

  private preCreateProcess: boolean = false;
  private tokenContract: any;

  constructor(
    protected contractsService: ContractsService,
    private userService: UserService,
    private route: ActivatedRoute,
    protected router: Router,
    private web3Service: Web3Service,
    private dialog: MatDialog
  ) {
    this.reqData = this.route.snapshot.data.contract;
    this.currentUser = this.userService.getUserModel();

    this.userService.getCurrentUser(false, true).subscribe((user: UserInterface) => {
      if (user.is_ghost) {
        if (this.reqData.id) this.userService.openAuthForm();
      }
      else {
        // if (!this.currentUser || this.currentUser.is_ghost) {
          if (this.preCreateProcess) this.nextStep(2);
        if (this.reqData.id && !this.checker) {
          if (this.reqData.state != 'CREATED') {
            this.checkContractStatus();
          }
          // this.checkContractStatus();
        }
        // }
      }
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.tokens = window['cmc_tokens'];

    this.popular.map(tokenAddress => {
      this.tokens.find(token => {
        if (token.address === tokenAddress) token.popular = true;
      })
    });

    if (this.reqData) {
      // if (this.reqData.state != 'CREATED') this.checkContractStatus();
      this.checkContractStatus();
      this.curDate = new Date(this.reqData.contract_details.end_timestamp * 1000);  
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

  public onCopied(field) {
    if (this.copiedAddresses[field]) return;
    this.copiedAddresses[field] = true;
    setTimeout(() => {this.copiedAddresses[field] = false;}, 1000);
  }

  private openTrxWindow(tokenAddress) {
    console.log(tokenAddress);
    this.web3Service.getTokenInfo(tokenAddress).then(
      (response) => {
        this.createTransactions(0, response.data);
      },
      (error) => { console.trace(`Rejected: ${error}`) }
    )
  }

  // private disAllow(amount, token) {

  // }

  private createTransactions(amount, token) {
    try {
      if (isNaN(amount)) return;

      const approveMethod = this.web3Service.getMethodInterface('approve');
      const approveSignature = this.web3Service.encodeFunctionCall(
        approveMethod, [
          this.reqData.contract_details.eth_contract.address,
          new BigNumber(90071992.5474099).times(Math.pow(10, token.decimals)).toString(10)
        ]
      );

      const checkAllowance = (wallet) => {
        return new Promise((resolve, reject) => {
          const tokenModel = token;
          this.tokenContract = this.web3Service.getContract(ERC20_TOKEN_ABI, tokenModel.address);
          this.tokenContract.methods.allowance(wallet, this.reqData.contract_details.eth_contract.address).call().then((result) => {
            result = result ? result.toString(10) : result;
            result = result === '0' ? null : result;
            if (result && new BigNumber(result).minus(amount).isPositive()) {
              resolve(true);
            } else {
              reject(false);
            }
          }, () => {
            reject(false);
          });
        });
      };

      const approveTransaction = (wallet) => {
        return this.web3Service.sendTransaction({
          from: wallet.address,
          to: token.address,
          data: approveSignature
        }, wallet.type);
      };

      const transactionsList: any[] = [{
        title: 'Authorise the contract for getting ' + token.symbol + ' tokens',
        to: token.address,
        data: approveSignature,
        checkComplete: checkAllowance,
        action: approveTransaction
      }];

      this.dialog.open(TransactionComponent, {
        width: '38.65em',
        panelClass: 'custom-dialog-container',
        data: {
          transactions: transactionsList,
          title: 'Contribute',
          description: `For contribution you need to make ${transactionsList.length} transactions: authorise the contract and make the transfer`
        }
      });

    } catch (e) {
      console.log(e);
    }
  }

  private tokenApprovedInfo() {
    let approveTokens = this.tokensApproved;
    let savedApprovedTokens = this.savedApprovedTokens;

    let add = approveTokens.filter((item) => {
      console.log(item, savedApprovedTokens);
      return savedApprovedTokens.filter((savedItem) => {
        return savedItem.address === item.address;
      }).length;
    });

    // let deleted = savedApprovedTokens.filter(item => approveTokens.indexOf(item) < 0);
    let deleted = savedApprovedTokens.filter((item) => {
      console.log(item, approveTokens);
      return approveTokens.indexOf(item) < 0;
    });

    console.log('approved', approveTokens);
    console.log('add', add);
    console.log('deleted', deleted);

    if (add || deleted) {
      this.tokens = this.tokens.map(token => {
        if (add) add.forEach(approvedTokenAddress => {
            token.approved = token.address === approvedTokenAddress.address;
        })


        if (deleted) deleted.forEach(approvedTokenAddress => {
          if (token.address === approvedTokenAddress.address)
            token.approved = false;
        })
        this.savedApprovedTokens = Object.assign([], approveTokens);
        return token;
      })
      
    }
  }

  onSelect(token:any): void {
    this.selectedToken = token;
  }

  public changeTokenStatus(value: string, e?) {
    if (e === false) {
      this.tokensApproved.splice(this.tokensApproved.findIndex(e => e.address === value), 1);
      return;
    }

    this.tokensApproved.push(value);
    this.openTrxWindow(value);
  }

  public loadMoreTokensFilter(tokenLength?:number) {
    if ((this.filterTokensLimit + 10) > tokenLength) this.filterTokensLimit = tokenLength;
    else this.filterTokensLimit = this.filterTokensLimit + 10;
  }

  public nextStep(stepNumber) {

    if (stepNumber <= 0) this.stepper.current = stepNumber;

    if (stepNumber === 1) {
      let date = new Date();
      this.minDate = new Date(date.setDate(date.getDate())); // this.minDate = new Date(date.setDate(date.getDate() + 1));
      this.curDate = new Date(date.setDate(date.getDate() + 1095));
      this.reqData.contract_details.owner_address === this.reqData.contract_details.reserve_address ? null : this.stepper.current = stepNumber;
      console.log('login here pls');
    }

    if (stepNumber === 2) {
      this.reqData.contract_details.email ? null : this.reqData.contract_details.email = 'none@none';
      this.nextStepProcess = true;
      this.dateChange();

      if (!this.currentUser.is_ghost) {
        if (this.reqData.id) {
          this.reqData.contract_details.eth_contract = null;
          this.contractsService.updateContract(this.reqData).then((rez) => {
            this.reqData = rez;
            this.checkContractStatus();
            this.stepper.current = stepNumber;
            this.nextStepProcess = false;
          }).catch(err => {console.log(err);});
        }
        else {
          this.contractsService.createContract(this.reqData).then((rez) => {
            this.reqData = rez;
            this.stepper.current = stepNumber;
            this.nextStepProcess = false;
            window.history.pushState(this.reqData.id, "Create Contract", "/create/" + this.reqData.id);
          }).catch(err => {console.log(err);});
        }
      }
      else {
        this.preCreateProcess = true;
        this.userService.openAuthForm().then(() => { this.nextStep(2); }, (error) => { console.log(error); this.preCreateProcess = false; this.nextStepProcess = false;});
      }
    }
    
    if (stepNumber === 3 ) {
      this.nextStepProcess = true;
      this.contactEdited = false;
      if (!this.currentUser.is_ghost) {
        this.contractsService.prepareForPayment(this.reqData.id).then((rez) => {
          this.reqData = rez;
          this.checkContractStatus();
        }).catch(err => {
          this.nextStepProcess = false;
          console.log(err);
        });
      }
      else {
        this.openLogInForm();
      }
    }

    if (stepNumber === 4 && !this.currentUser.is_ghost) {
      this.nextStepProcess = true;
      if (!this.currentUser.is_ghost) {
        this.stepper.current = stepNumber;
        this.nextStepProcess = false;
      }
      else {
        this.openLogInForm();
      }
    }

    (stepNumber === 5 && !this.currentUser.is_ghost) ? this.stepper.current = stepNumber : null;

    if (stepNumber === 6) {
      this.nextStepProcess = true;
      this.confirmStatus = true;

      if (!this.currentUser.is_ghost) {
        if (this.reqData.id) {
          this.contractsService.confirmContract(this.reqData.id).then((rez) => {
            this.reqData = rez;
            this.checkContractStatus();
          }).catch(err => {
            this.confirmStatus = false;
            this.nextStepProcess = false;
            console.log(err);
          });
        } else this.userService.openAuthForm().then(() => { this.nextStep(6) }, () => { this.nextStepProcess = false; });
      } else this.userService.openAuthForm().then(() => {}, () => { this.preCreateProcess = false; this.nextStepProcess = false; });
    }
  }

  private openLogInForm() {
    this.userService.openAuthForm().then(() => {}, () => { this.nextStepProcess = false; });
  }

  private changeStepsStatus(editable?:boolean,preview?:boolean,stepProcess?:boolean) {
    this.editableTokenProtector = (editable || false);
    this.previewTrigger = (preview || false);;
    this.nextStepProcess = (stepProcess || false);;
  }

  private checkContractStatus() {

    const user = this.currentUser || this.userService.getUserModel();

    switch (this.reqData.state) {
      case 'CREATED':
        console.log(this.reqData.state);
        this.stepper.current = 2;
        this.changeStepsStatus(true, false, false);
        return;
      case 'WAITING_FOR_PAYMENT':
        console.trace();
        console.log(this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        this.stepper.current = 3;
        this.changeStepsStatus(false, true, false);
        break;
      case 'WAITING_FOR_DEPLOYMENT':
        console.log(this.reqData.state);
        this.stepper.current = 4;
        this.changeStepsStatus(false, true, false);
        break;
      case 'WAITING_FOR_APPROVE':
        console.log(this.reqData.state);
        this.tokensApproved = this.reqData.contract_details.approved_tokens;
        this.tokenApprovedInfo();
        this.stepper.current = 5;
        this.changeStepsStatus(false, true, false);
        break;
      case 'WAITING_FOR_CONFIRM':
        console.log(this.reqData.state);
        this.confirmStatus = true;
        this.stepper.current = 6;
        this.changeStepsStatus(false, true, false);
        break;
      case 'ACTIVE':
        console.log(this.reqData);
        this.router.navigate(['/contract' + this.reqData.id]);
        break;
      case 'FAIL_IN_CONFIRM':
        console.log(this.reqData.state);
        this.confirmStatus = false;
        this.stepper.current = 5;
        this.confirmErrorMessage = "Something went wrong, please try again or contact us";
        this.changeStepsStatus(false, true, false);
        return;
      case 'POSTPONED':
        console.log(this.reqData.state);
        this.stepper.current = 4;
        this.changeStepsStatus(false, true, false);
        return;
      default:
        console.log(this.reqData.state);
        break;
    }

    // console.log(this.currentUser);

    if (!user.is_ghost) this.checker = setTimeout(() => { this.getContractInformation() }, 5000);
    else this.checker = undefined;
  }

  private getContractInformation() {
    let promise = this.contractsService.getContract(this.reqData.id);
    promise.then((result) => {
      const costs = this.reqData.cost;
      this.reqData = result;
      this.reqData.cost = costs;
      this.checkContractStatus();
    }).catch((error) => {console.log('something went wrong, please try again later or check your auth', error);});
  };

  public dateChange() {
    var CurrentTime = new Date(this.curDate);
    CurrentTime.setMinutes(new Date().getMinutes() + 10);
    if (new Date().getMinutes() >= 50) CurrentTime.setHours(new Date().getHours());
    else CurrentTime.setHours(new Date().getHours() + 1);
    this.curDate = new Date(CurrentTime);
    console.log('Date chosen:', this.curDate);
    this.reqData.contract_details.end_timestamp = Math.floor(this.curDate / 1000);
    console.log(this.reqData.contract_details.end_timestamp);
  }
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