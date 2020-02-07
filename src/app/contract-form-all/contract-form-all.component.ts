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
import { setTimeout } from 'timers';

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
  approved: any;
  saved: any;
  check: any;
  removed: any;
  blockchain_approve: any;
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
    state: 'CHOOSE_NETWORK',
    name: 'TokenProtector',
    contract_details: {
      owner_address: '',
      reserve_address: '',
      end_timestamp: 1,
      email: '',
    }
  };

  public tokensData: ITokens = {
    tokens: [],
    approved: [],
    saved: [],
    check: [],
    removed: [],
    blockchain_approve: [],
    filterLimit: 10,
    search: ''
  }
  
  public tsDate: ITDate = {
    min: new Date(new Date().setDate(new Date().getDate() + 1)), //new Date(new Date().setDate(new Date().getDate()))
    max: null,
    current: new Date().getDate() + 1095
  }

  public tsSrepper: ITsStepper = {
    current: 'CHOOSE_NETWORK',
    number: 0,
    button: {
      process: false,
      error: false
    }
  }

  public networkMode = [
    {name: 'Error',tokens: [],popular: []},
    {name: 'Mainnet',tokens: [],popular: ['0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d','0x7f7143631f89e1bbe955a7859cbf3ee082cc2898','0xa0379b1ac68027a76373adc7800d87eb5c3fac5e','0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D']},
    {name: 'Testnet',tokens: [],popular: ['0x5aed0f4b4c6a8e5c271b7e6768c77dc627cddc6d','0x7f7143631f89e1bbe955a7859cbf3ee082cc2898','0xa0379b1ac68027a76373adc7800d87eb5c3fac5e','0x36d10c6800d569bb8c4fe284a05ffe3b752f972c', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', '0x03c780cd554598592b97b7256ddaad759945b125', '0x01cc4151fe5f00efb8df2f90ff833725d3a482a3', '0x8810c63470d38639954c6b41aac545848c46484a', '0xa7fc5d2453e3f68af0cc1b78bcfee94a1b293650', '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4', '0x7728dFEF5aBd468669EB7f9b48A7f70a501eD29D']}
  ]

  private currentUser;
  private checker;
  public copiedAddresses = {};
  public approvedFinnalTokens:boolean = false;

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
    this.reqData = this.route.snapshot.data.contract || this.reqData;
    this.currentUser = this.userService.getUserModel();

    this.userService.getCurrentUser(false, true).subscribe((user: UserInterface) => {
      if (user.is_ghost)
        if (this.reqData.id) this.userService.openAuthForm();
      this.currentUser = user;
    });
  }

  ngOnInit() {

    if (this.reqData) this.tsDate.current = new Date(this.reqData.contract_details.end_timestamp * 1000);
    else {
      this.reqData = {
        contract_type: 23,
        network: 1,
        state: 'CHOOSE_NETWORK',
        name: 'TokenProtector',
        contract_details: {owner_address: '',reserve_address: '',end_timestamp: 1,email: '',}
      } as IReqData;

      this.tsSrepper = {
        current: 'CHOOSE_NETWORK',
        button: {process: false}
      } as ITsStepper;
    }

    
    // setTimeout(() => {
      this.networkMode[1].tokens = Object.assign(window['cmc_tokens_main']);
      this.networkMode[2].tokens = Object.assign(window['cmc_tokens']);
      this.tokenProtectorInit();
      this.checkContractStatus();
    // },1000);
    

  }

  ngAfterContentInit() { }

  ngOnDestroy() {
    if (this.checker) { clearTimeout(this.checker); }
    this.tokensData.tokens.map(token => {
      token.approved = false;
    });
  }

  public tokenProtectorInit() {
    console.log('dasdasdas:',this.networkMode[this.reqData.network].tokens)
    this.tokensData.tokens = Object.assign(this.networkMode[this.reqData.network].tokens);

    this.networkMode[this.reqData.network].popular.map(tokenAddress => {
      this.tokensData.tokens.find(token => {
        (token.address === tokenAddress) ? token.popular = true : null;
      });
    });

    this.tokensData.tokens.map(token => {
      token.approved = false;
    });
  }

  public checkContractStatus(stepperState?:string) {

    const user = this.currentUser || this.userService.getUserModel();
    this.reqData.state = stepperState || this.reqData.state;
    
    switch (this.reqData.state) {
      case 'CHOOSE_NETWORK':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = false;
        this.tsSrepper.current = 'CHOOSE_NETWORK';
        return;

      case 'PREPARE_ADDRESS':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = true;
        this.tsSrepper.current = 'PREPARE_ADDRESS';
        this.tsSrepper.button.process = false;
        return;
      
      case 'PREPARE_DATE_EMAIL':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = true;
        if (this.reqData.contract_details.owner_address === this.reqData.contract_details.reserve_address) {
          this.checkContractStatus('PREPARE_ADDRESS');
        } else { this.tsSrepper.current = 'PREPARE_DATE_EMAIL';}
        this.tsSrepper.button.process = false;
        return;
      
      case 'CREATING_UPDATE':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = true;
        // setTimeout(() => {
          if (!this.currentUser.is_ghost) {
            if (this.reqData.id) {
              this.reqData.contract_details.eth_contract = null;
              this.contractsService.updateContract(this.reqData).then((result) => {
                this.reqData = result;
                this.checkContractStatus('CREATED');
              }).catch(err => { this.reqData.state = 'PREPARE_DATE_EMAIL';});
            }
            else {
              this.contractsService.createContract(this.reqData).then((result) => {
                window.history.pushState(this.reqData.id, 'Create Contract', '/create/' + result.id);
                this.reqData = result;
                this.checkContractStatus('CREATED');
              }).catch(err => { this.reqData.state = 'PREPARE_DATE_EMAIL'; console.log(err);});
            }
          } else {this.reqData.state = 'PREPARE_DATE_EMAIL'; this.openLogInForm('CREATING_UPDATE');}
        // }, 10000);
        break;

      case 'CREATED':
        this.tsSrepper.button.process = false;
        console.log(this.reqData.state);
        return;

      case 'WAITING_FOR_CONFIRM':
      case 'WAITING_FOR_DEPLOYMENT':
        console.log(this.reqData.state);
        break;
      
      case 'CONFIRM_CONTRACT':
        console.log(this.reqData.state);
        this.tsSrepper.button.process = true;
        if (!this.currentUser.is_ghost) {
          this.contractsService.prepareForPayment(this.reqData.id).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
            this.tsSrepper.button.process = false;
          }).catch(err => { this.reqData.state = 'CREATED'; console.log(err); });
        } else {this.openLogInForm('CONFIRM_CONTRACT'); this.tsSrepper.button.process = false;}
        break;

      case 'WAITING_FOR_PAYMENT':
        console.log(this.reqData.state);
        this.costEmitter.emit(this.reqData.cost);
        break;
      
      case 'WAITING_FOR_APPROVE':
        console.log(this.reqData.state);
        this.tokensData.approved = this.reqData.contract_details.approved_tokens;
        this.tokenApprovedInfo();
        break;
      
      case 'CONFIRM_APPROVE':
        console.log(this.reqData.state);
        if (!this.currentUser.is_ghost) {
          console.log(this.tokensData.saved.length,this.tokensData.saved,);
          this.contractsService.confirmContract(this.reqData.id,this.tokensData.saved).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
          }).catch(err => { this.reqData.state = 'FAIL_IN_CONFIRM'; console.log(err); });
        } else { this.openLogInForm('CONFIRM_APPROVE'); }
        break;

      case 'SKIP_CONFIRM_APPROVE':
        console.log(this.reqData.state);
        if (!this.currentUser.is_ghost) {
          this.contractsService.skipConfirmContract(this.reqData.id).then((result) => {
            this.reqData = result;
            this.checkContractStatus();
          }).catch(err => { this.reqData.state = 'FAIL_IN_CONFIRM'; console.log(err); });
        } else { this.openLogInForm('SKIP_CONFIRM_APPROVE'); }
        break;

      case 'ACTIVE':
      case 'WAITING_FOR_EXECUTION':
        this.router.navigate(['/contract/' + this.reqData.id]);
        break;

      case 'FAIL_IN_CONFIRM':
        console.log(this.reqData.state);
        this.confirmErrorMessage = 'Something went wrong, please try again or contact us';
        (this.checker) ? clearTimeout(this.checker) : null;
        return;

      case 'POSTPONED':
      case 'CANCELLED':
      case 'FAILED':
      case 'TIME_IS_UP':
      case 'EXPIRED':
        console.log(this.reqData.state);
        (this.checker) ? clearTimeout(this.checker) : null;
        return;
      
      default:
        console.log(this.reqData.state);
        break;
    }

    if (!user.is_ghost && this.reqData.state != 'ACTIVE') { this.checker = setTimeout(() => { this.getContractInformation(); }, 5000); } else { this.checker = undefined; }
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
    const approvedToken = this.tokensData.approved.map(token => {return token.address}); // с бекенда
    const blockchain_approve = this.tokensData.blockchain_approve; // с фронта
    const removedToken = this.tokensData.removed; // с фронта

    console.log('I.   add:',approvedToken);
    console.log('II.  add front:',blockchain_approve);
    console.log('III. remove front:',removedToken);

    console.log('1. backend approve:',approvedToken);

    blockchain_approve.map(blockchain_approved => {
      if (!approvedToken.includes(blockchain_approved)) {
        approvedToken.push(blockchain_approved);
      }
    });

    console.log('2. front approve:',approvedToken);

    const saveTokens = approvedToken.filter(approved => {
      return !removedToken.includes(approved);
    });

    console.log('3. front approve after remove:', saveTokens);

    if(saveTokens.length != this.tokensData.saved.length){
      console.log(saveTokens.length,this.tokensData.saved.length)

      const newTokens = this.tokensData.tokens.map(token => {
        if (saveTokens.includes(token.address)) {token.approved = true;}
        else {token.approved = false;}
        (this.networkMode[this.reqData.network].popular.includes(token.address)) ? token.popular = true : token.popular = false;
        return token;
      });

      this.tokensData.tokens = Object.assign(newTokens);
      this.tokensData.saved = Object.assign(saveTokens);
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
    CurrentTime.setMinutes(new Date().getMinutes());
    // (new Date().getMinutes() >= 50) ? CurrentTime.setHours(new Date().getHours() + 1) : CurrentTime.setHours(new Date().getHours());
    CurrentTime.setHours(new Date().getHours() + 1)
    this.tsDate.current = new Date(CurrentTime);
    console.log('Date chosen: ', this.tsDate.current);
    this.reqData.contract_details.end_timestamp = Math.floor(this.tsDate.current / 1000);
    console.log('Timestamp: ',this.reqData.contract_details.end_timestamp);
  }

  private openTrxWindow(tokenAddress, disaprove?:boolean) {
    console.log(tokenAddress);
    this.web3Service.getTokenInfo(tokenAddress).then(
      (response) => {
        if (disaprove) {this.createTransactions(0, response.data);}
        else { this.createTransactions(1, response.data); }
      }
    ).catch(err => { console.log(err)});
  }

  public startCheckAllowance(token,amount){
    console.log(token);

      var interval = setInterval(() => {

        console.log('Cheking:',token);
        
        return new Promise((resolve, reject) => {
            const tokenModel = token;
            const tokenContract = this.web3Service.getContract(ERC20_TOKEN_ABI, tokenModel.address);

            tokenContract.methods.allowance(this.reqData.contract_details.owner_address, this.reqData.contract_details.eth_contract.address).call().then((result) => {
              result = result ? result.toString(10) : result;
              result = result === '0' ? null : result;

              if (result && new BigNumber(result).minus(amount).isPositive()) {
                if(amount != 0) {
                  console.log('BLOCKCHAIN TOKEN IF:',result);
                  this.tokensData.blockchain_approve.push(token.address);
                  this.tokensData.removed.filter(item => item !== token.address);
                  this.tokenApprovedInfo();
                  clearInterval(interval);
                }

                resolve(true);

              } else {
                
                if(amount === 0) {
                  console.log('BLOCKCHAIN TOKEN ELSE:', result);
                  this.tokensData.removed.push(token.address);
                  this.tokenApprovedInfo();
                  clearInterval(interval);
                }

                resolve(0);
              }
            }, (err) => {
              console.log(err);
              reject(false);
            });
          });

      }, 5000)
  }


  private createTransactions(amount, token) {

    try {
      if (isNaN(amount)) { return; }

      const approveMethod = this.web3Service.getMethodInterface('approve');
      const amountToApprove = (amount === 0) ? 0 : new BigNumber(90071992.5474099).times(Math.pow(10, token.decimals)).toString(10);

      this.startCheckAllowance(token,amountToApprove);

      const approveSignature = this.web3Service.encodeFunctionCall(
        approveMethod, [
          this.reqData.contract_details.eth_contract.address,
          amountToApprove
        ]
      );

      const approveTransaction = (wallet) => {
        return this.web3Service.sendTransaction({
          from: wallet.address,
          to: token.address,
          data: approveSignature
        }, wallet.type);
      };

      if (amount === 0) {

        const transactionsList: any[] = [{
          title: 'Cancel approve for  ' + token.symbol + ' tokens',
          to: token.address,
          data: approveSignature,
          // checkComplete: checkAllowance,
          action: approveTransaction,
          onlyOwner: this.reqData.contract_details.owner_address
        }];

        this.dialog.open(TransactionComponent, {
          width: '38.65em',
          panelClass: 'custom-dialog-container',
          data: {
            transactions: transactionsList,
            title: 'Cancel Approve',
          }
        });
      }
      else {

        const transactionsList: any[] = [{
          title: 'Authorise the contract for transfer ' + token.symbol + ' tokens',
          to: token.address,
          data: approveSignature,
          //checkComplete: this.startCheckAllowance(token,amountToApprove),
          action: approveTransaction,
          onlyOwner: this.reqData.contract_details.owner_address
        }];

        this.dialog.open(TransactionComponent, {
          width: '38.65em',
          panelClass: 'custom-dialog-container',
          data: {
            transactions: transactionsList,
            title: 'Approve',
          }
        });
      }


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
