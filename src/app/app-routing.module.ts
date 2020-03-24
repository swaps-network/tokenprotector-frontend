import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { WillComponent } from './will/index.component';
import { ContractFormComponent } from './contract-form/contract-form.component';
import { ContractsListComponent, ContractsListResolver } from './contracts-list/contracts-list.component';
import { ContractFormAllComponent, ContractEditResolver2 } from './contract-form-all/contract-form-all.component';

let currMode = 'PROD';

export const MODE = currMode;

const routes: Routes = [
  {
    path: '',
    component: IndexComponent
  }, {
    path: 'create',
    component: ContractFormAllComponent,
    data: {
      network: 1
    }
  }, {
    path: 'create/:id',
    component: ContractFormAllComponent,
    resolve: {
      contract: ContractEditResolver2
    }
  }, {
    path: 'contract/:id',
    component: ContractFormComponent,
    resolve: {
      contract: ContractEditResolver2
    },
    data: {
      createButton: true
    }
  }, {
    path: 'contracts',
    component: ContractsListComponent,
    resolve: {
      contracts: ContractsListResolver
    }
  }, {
    path: 'dashboard/first_entry',
    redirectTo: '/'
  },{
    path: 'first_entry',
    redirectTo: '/'
  },{
    path: 'will',
    component: WillComponent
  },
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      onSameUrlNavigation: 'reload',
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

