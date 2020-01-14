import { AfterContentInit, Component, EventEmitter, Injectable, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDatepicker, MatDialog } from '@angular/material';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';

import { TransactionComponent } from '../transaction/transaction.component';
import { MY_FORMATS } from '../contract-form/contract-form.component';

import { UserService } from '../services/user/user.service';
import { Web3Service } from '../services/web3/web3.service';
import { ContractsService } from '../services/contracts/contracts.service';
import { ERC20_TOKEN_ABI } from '../services/web3/web3.constants';
import { UserInterface } from '../services/user/user.interface';

import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';

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

export interface ITokens {
  tokens: any;
  popular: any;
  approved: any;
  saved: any;
  filterLimit: number;
  search: string;
}

export interface ITDate {
  max: any;
  min: any;
  current: any;
}

export interface ITsStepper {
  current?: string;
  number?: number;
  button?: {
    process?: boolean;
    error?: boolean;
  }
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
    state: 'PREPARE_ADDRESS',
    name: 'TokenProtector',
    contract_details: {
      owner_address: '',
      reserve_address: '',
      end_timestamp: 1,
      email: '',
    }
  };

  public tokensData: ITokens = {
    tokens: window['cmc_tokens'],
    popular: ['0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D'],
    approved: [],
    saved: [],
    filterLimit: 10,
    search: ''
  }
  
  public tsDate: ITDate = {
    min: new Date(new Date().setDate(new Date().getDate())), // new Date(new Date().setDate(new Date().getDate() + 1))
    max: null,
    current: new Date().getDate() + 1095
  }

  public tsSrepper: ITsStepper = {
    current: 'PREPARE_ADDRESS',
    number: 0,
    button: {
      process: false,
      error: false
    }
  }

  private currentUser;
  private checker;
  public copiedAddresses = {};

  // remove in future

  public confirmErrorMessage = '';
  public selectedToken: any;

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
      if (user.is_ghost)
        if (this.reqData.id) this.userService.openAuthForm();
      this.currentUser = user;
    });
  }

  ngOnInit() {

    this.tokensData.popular.map(tokenAddress => {
      this.tokensData.tokens.find(token => {
        (token.address === tokenAddress) ? token.popular = true : null;
      });
    });

    if (this.reqData) {
      this.tsDate.current = new Date(this.reqData.contract_details.end_timestamp * 1000);
      console.log('have data: ', this.reqData);
    } else {
      this.reqData = {
        contract_type: 23,
        network: 1,
        state: 'PREPARE_ADDRESS',
        name: 'TokenProtector',
        contract_details: {
          owner_address: '',
          reserve_address: '',
          end_timestamp: 1,
          email: '',
        }
      } as IReqData;

      this.tsSrepper = {
        current: 'PREPARE_ADDRESS',
        button: {
          process: false
        }
      }
      console.log('dont have data: ', this.reqData);
    }
    this.checkContractStatus();
  }

  ngAfterContentInit() { }

  ngOnDestroy() {
    if (this.checker) { clearTimeout(this.checker); }
  }

  public checkContractStatus(stepperState?:string) {

    const user = this.currentUser || this.userService.getUserModel();
    this.reqData.state = stepperState || this.reqData.state;
    
    switch (this.reqData.state) {

      case 'PREPARE_ADDRESS':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = false;
        this.tsSrepper.current = 'PREPARE_ADDRESS';
        return;
      
      case 'PREPARE_DATE_EMAIL':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = true;
        if (this.reqData.contract_details.owner_address === this.reqData.contract_details.reserve_address) {
          this.checkContractStatus('PREPARE_ADDRESS')
        } else { this.tsSrepper.current = 'PREPARE_DATE_EMAIL' }
        this.tsSrepper.button.process = false;
        return;
      
      case 'CREATE':
        console.log(this.reqData.state);
        if (!this.currentUser.is_ghost) {
          if (this.reqData.id) {
            this.reqData.contract_details.eth_contract = null;
            this.contractsService.updateContract(this.reqData).then((result) => {
              this.reqData = result;
            }).catch(err => { this.reqData.state = 'PREPARE_DATE_EMAIL';});
          }
          else {
            this.reqData.contract_details.email ? null : this.reqData.contract_details.email = 'none@none';
            this.contractsService.createContract(this.reqData).then((result) => {
              window.history.pushState(this.reqData.id, 'Create Contract', '/create/' + result.id);
              this.reqData = result;
            }).catch(err => { this.reqData.state = 'PREPARE_DATE_EMAIL';});
          }
        } else { this.tsSrepper.button.process = true; this.reqData.state = 'PREPARE_DATE_EMAIL'; this.openLogInForm('CREATE');}
        return;
      
      case 'CREATED':
        console.log(this.reqData.state);
        return;
      
      case 'CONFIRM_CONTRACT':
        console.log(this.reqData.state);
        if (!this.currentUser.is_ghost) {
          this.contractsService.prepareForPayment(this.reqData.id).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
          }).catch(err => { this.reqData.state = 'CREATED'; console.log(err);});
        } else {this.openLogInForm('CONFIRM_CONTRACT');}
        break;

      case 'WAITING_FOR_PAYMENT':
        console.log(this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        break;
      
      case 'WAITING_FOR_DEPLOYMENT':
        console.log(this.reqData.state);
        break;
      
      case 'WAITING_FOR_APPROVE':
        console.log(this.reqData.state,this.reqData.contract_details.approved_tokens);
        this.tokensData.approved = this.reqData.contract_details.approved_tokens;
        this.tokenApprovedInfo();
        break;
      
      case 'WAITING_FOR_CONFIRM':
        console.log(this.reqData.state);
        break;
      
      case 'CONFIRM_APPROVE':
        console.log(this.reqData.state);
        if (!this.currentUser.is_ghost) {
          this.contractsService.confirmContract(this.reqData.id).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
          }).catch(err => {this.reqData.state = 'FAIL_IN_CONFIRM';console.log(err);});
        } else {this.openLogInForm('CONFIRM_APPROVE');}

      case 'ACTIVE':
        this.router.navigate(['/contract/' + this.reqData.id]);
        break;

      case 'FAIL_IN_CONFIRM':
        console.log(this.reqData.state);
        this.confirmErrorMessage = 'Something went wrong, please try again or contact us';
        (this.checker) ? clearTimeout(this.checker) : null;
        return;

      case 'POSTPONED':
        console.log(this.reqData.state);
        (this.checker) ? clearTimeout(this.checker) : null;
        return;
      
      default:
        console.log(this.reqData.state);
        break;
    }

    if (!user.is_ghost) { this.checker = setTimeout(() => { this.getContractInformation(); }, 5000); } else { this.checker = undefined; }
  }

  private getContractInformation() {
    const promise = this.contractsService.getContract(this.reqData.id);
    promise.then((result) => {
      const costs = this.reqData.cost;
      this.reqData = result;
      this.reqData.cost = costs;
      this.checkContractStatus();
    }).catch((error) => {console.log('something went wrong, please try again later or check your auth', error); });
  }

  private openLogInForm(state?:string) {
    this.userService.openAuthForm().then(() => { this.checkContractStatus(state || this.reqData.state)}, () => { this.tsSrepper.button.process  = false; });
  }

  private tokenApprovedInfo() {
    const approveTokens = this.tokensData.approved;
    const savedApprovedTokens = this.tokensData.saved;

    const add = approveTokens.filter((item) => {
      return !savedApprovedTokens.filter((savedItem) => {
        return savedItem === item.address;
      }).length;
    }).map((t) => {
      return t.address;
    });

    const deleted = savedApprovedTokens.filter((item) => {
        return !approveTokens.filter((approveItem) => {
            return approveItem.address === item;
        }).length;
    }).map((t) => {
        return t.address;
    });

    if (add.length || deleted.length) {
      this.tokensData.tokens = this.tokensData.tokens.map((token) => {
        if (add.length && add.indexOf(token.address) > -1) {
          token.approved = true;
        }
        if (deleted.length && deleted.indexOf(token.address) > -1) {
          token.approved = false;
        }
        return token;
      });

      this.tokensData.saved = this.tokensData.tokens.filter((token) => {
          return token.approved;
      }).map((t) => {
        return t.address;
      });
    }
  }

  public changeTokenStatus(value: string, disaprove?: boolean) {
    this.openTrxWindow(value, disaprove);
  }

  public onSelect(token: any): void {
    this.selectedToken = token;
  }

  public onCopied(field) {
    if (this.copiedAddresses[field]) { return; }
    this.copiedAddresses[field] = true;
    setTimeout(() => {this.copiedAddresses[field] = false; }, 1000);
  }

  public loadMoreTokensFilter(tokenLength?: number) {
    if ((this.tokensData.filterLimit + 10) > tokenLength) { this.tokensData.filterLimit = tokenLength; } else { this.tokensData.filterLimit = this.tokensData.filterLimit + 10; }
  }

  public dateChange() {
    const CurrentTime = new Date(this.tsDate.current);
    CurrentTime.setMinutes(new Date().getMinutes() + 10);
    (new Date().getMinutes() >= 50) ? CurrentTime.setHours(new Date().getHours() + 1) : CurrentTime.setHours(new Date().getHours());
    this.tsDate.current = new Date(CurrentTime);
    console.log('Date chosen: ', this.tsDate.current);
    this.reqData.contract_details.end_timestamp = Math.floor(this.tsDate.current / 1000);
    console.log('Timestamp: ',this.reqData.contract_details.end_timestamp);
  }

  private openTrxWindow(tokenAddress, disaprove?:boolean) {
    console.log(tokenAddress);
    this.web3Service.getTokenInfo(tokenAddress).then(
      (response) => {
        if (disaprove) {
          console.log('disaprove'); this.createTransactions(0, response.data);
        }
        else { this.createTransactions(1, response.data); }
      }
    );
  }

  private createTransactions(amount, token) {
    try {
      if (isNaN(amount)) { return; }

      const approveMethod = this.web3Service.getMethodInterface('approve');
      const amountToApprove = (amount === 0) ? 0 : new BigNumber(90071992.5474099).times(Math.pow(10, token.decimals)).toString(10);

      console.log(amountToApprove);

      const approveSignature = this.web3Service.encodeFunctionCall(
        approveMethod, [
          this.reqData.contract_details.eth_contract.address,
          amountToApprove
        ]
      );

      const checkAllowance = (wallet) => {
        return new Promise((resolve, reject) => {
          const tokenModel = token;
          const tokenContract = this.web3Service.getContract(ERC20_TOKEN_ABI, tokenModel.address);
          tokenContract.methods.allowance(wallet, this.reqData.contract_details.eth_contract.address).call().then((result) => {
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
    const promise = this.contractsService.getContract(this.contractId);
    promise.then((result) => {
      observer.next(result);
      observer.complete();
    });
  }

  resolve(route: ActivatedRouteSnapshot) {
    this.route = route;

    if (route.params.id) {
      this.contractId = route.params.id;

      return new Observable((observer) => {
        const subscription = this.userService.getCurrentUser(false, true).subscribe((user) => {
          this.currentUser = user;
          if (!user.is_ghost) { this.getContractInformation(observer); } else {
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
