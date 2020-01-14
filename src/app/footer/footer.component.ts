import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  public current_site_year: number = new Date().getFullYear();
  
  constructor() { }

  ngOnInit() {
  }
  public onSubmit(form) {
    form.submit();
  }
}
