
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class CostService {
 private observe: any;
 private readonly observable: Observable<any>;
 public costs: object;

 constructor(private Http: HttpClient) {
   this.observable = new Observable((observe) => {
     this.observe = observe;
   });
   this.observable.subscribe();
 }

 private nextEvent() {
   this.observe.next(this.costs);
 }

 returnCosts() {
   if (this.costs) {
     setTimeout(() => {
       this.nextEvent();
     });
   }
   return this.observable;
 }
 loadCosts() {
   this.Http.get('/api/v1/get_all_costs/').subscribe(
     (res: HttpErrorResponse) => {
       this.costs = res;
       this.nextEvent();
     },
     (err) => {
       console.log(err);
     },
   );
 }
}