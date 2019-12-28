/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VariablesService } from './variables.service';

describe('Service: Variables', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VariablesService]
    });
  });

  it('should ...', inject([VariablesService], (service: VariablesService) => {
    expect(service).toBeTruthy();
  }));
});
