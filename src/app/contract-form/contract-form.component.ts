import { AfterContentInit, Component, Injectable, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { MatDatepicker } from '@angular/material';

import { UserService } from '../services/user/user.service';
import { ContractsService } from '../services/contracts/contracts.service';
import { UserInterface } from '../services/user/user.interface';

import { CONTRACT_STATES } from '../contract-preview/contract-states';
import { Observable } from 'rxjs';



export interface IContractDetails {
  base_address?: string;
  quote_address?: string;
  base_limit?: string;
  quote_limit?: string;
  stop_date?: number;
  owner_address?: string;
  public?: boolean|undefined;
  unique_link?: string;
  unique_link_url?: string;
  eth_contract?: any;

  broker_fee: boolean;
  broker_fee_address: string;
  broker_fee_base: number;
  broker_fee_quote: number;

  tokens_info?: {
    base: {
      token: any;
      amount: string;
    };
    quote: {
      token: any;
      amount: string;
    };
  };


  whitelist?: any;
  whitelist_address?: any;
  min_base_wei?: any;
  memo_contract?: any;
  min_quote_wei?: any;
}

export interface IContract {
  isSwapped?: boolean;
  contract_details?: IContractDetails;
  id?: number|undefined;
  contract_type?: number;
  network?: 1;
  state?: string;
  cost?: any;
  name?: string;
  isAuthor?: boolean;
  user?: number;
}

export const MY_FORMATS = {
  useUtc: true,
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'X',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};




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
  created_date?: any;
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
};

@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss'],
  providers: []
})
  
export class ContractFormComponent implements AfterContentInit, OnInit, OnDestroy {

  @ViewChild('rateNotification') rateNotification: TemplateRef<any>;
  @ViewChild('extraForm') public extraForm;
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;

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
  }

  public tokensData: ITokens = {
    tokens: window['cmc_tokens'],
    approved: ''
  }

  public currentUser;
  public curDate;
  public states = CONTRACT_STATES;
  
  constructor(
    protected contractsService: ContractsService,
    private userService: UserService,
    private route: ActivatedRoute,
    protected router: Router,
  ) {

    this.reqData = this.route.snapshot.data.contract;

    this.currentUser = this.userService.getUserModel();
    this.userService.getCurrentUser().subscribe((userProfile: UserInterface) => {
      this.currentUser = userProfile;
    });

  }

  ngOnInit() {
    if (this.reqData) {
      console.log(this.reqData);

      this.reqData.contract_details.approved_tokens.map(tokenAddress => {
        this.tokensData.tokens.find(token => {
          (token.address === tokenAddress.address) ? token.approved = true : null;
        });
      });

      this.curDate = new Date(this.reqData.contract_details.end_timestamp * 1000);
    }
    else {
      this.router.navigate(['/create']);
    }
  }

  ngAfterContentInit() {}

  ngOnDestroy(): void {}

}


@Injectable()
export class ContractEditResolver implements Resolve<any> {
  private currentUser;
  private route;

  constructor(
    private contractsService: ContractsService,
    private userService: UserService,
    private router: Router
  ) {}

  private contractId: number;


  private getContractInformation(observer, isPublic?) {
    let promise = this.contractsService.getContract(this.contractId);
    promise.then((result) => {observer.next(result);});
    observer.complete();
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
              ,() => { this.router.navigate(['/create']); });
          }
          subscription.unsubscribe();
        });
        return {
          unsubscribe() {}
        };

      });

    }

  }
}
