import { Injectable } from '@angular/core';
import { ITsStepper } from './variables.interface';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VariablesService {

constructor() { }

  public tsStepper: ITsStepper = {
    current: 'INIT_STEPPER'
  };

  public getTsStepper(): Observable<any> {
    return new Observable((observer) => {
      observer.next(this.tsStepper)
    })
  }; 

  public setTsStepper(state?:string) {
    console.log('setTsStepper', state);
    this.tsStepper.current = state;
  };    
  
}
