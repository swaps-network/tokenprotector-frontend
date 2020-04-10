import { Component, Inject, OnInit, PLATFORM_ID, TemplateRef, ViewChild } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import {LangChangeEvent, TranslateService} from "@ngx-translate/core";
import { UserService } from '../../services/user/user.service';
import { UserInterface } from '../../services/user/user.interface';
import { MatDialog, MatDialogRef } from '@angular/material';
import { NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private isBrowser: any;
  public pageScrolled: boolean;
  public currentUser: UserInterface;
  public openedMenu;
  public userMenuOpened;

  public openedLngList = false;
  private translator: TranslateService;
  public languagesList: { lng: string; title: string; active?: boolean }[];
  public currLanguage: string;
  public currentPath: string;

  @ViewChild('logoutConfirmation') logoutConfirmation: TemplateRef<any>;
  @ViewChild('headerPage') headerPage;

  private logoutConfirmationModal: MatDialogRef<any>;
  private logoutProgress: boolean;
  public routeLinkPage: string;

  constructor(
    @Inject(PLATFORM_ID) private platformId,
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    activatedRoute: Location,
    translate: TranslateService
  ) {



    this.currentUser = this.userService.getUserModel();
    this.userService.getCurrentUser().subscribe((userProfile: UserInterface) => {
      this.currentUser = userProfile;
    });

    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      window.onscroll = () => {
        const scrolled = window.pageYOffset || document.documentElement.scrollTop;
        this.pageScrolled = scrolled > 50;
      };
    }

    document.getElementsByTagName('body')[0]['addEventListener'](
      'mousedown',
      (event) => {
        this.openedMenu = false;
        this.userMenuOpened = false;
      }
    );

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.openedMenu = false;
        this.userMenuOpened = false;
      }
    });


    this.translator = translate;
    this.languagesList = [
      {
        lng: 'en',
        title: 'en'
      },
      {
        lng: 'zh',
        title: 'zh'
      },
      {
        lng: 'ja',
        title: 'ja'
      }
    ];


    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.setActiveLanguage(event);
    });
    this.setActiveLanguage({
      lang: translate.currentLang
    });

    this.currentPath = activatedRoute.path().split('?')[0];

  }

  private setActiveLanguage(event) {
    if (this.currLanguage) {
      this.languagesList.filter((lang) => {
        return lang['lng'] === this.currLanguage;
      })[0].active = false;
    }
    this.currLanguage = event.lang;

    // if (this.isBrowser) {
    //   jQuery['cookie']('lng', this.currLanguage);
    // }

    this.languagesList.filter((lang) => {
      return lang['lng'] === this.currLanguage;
    })[0].active = true;
    this.languagesList.sort((a, b) => {
      return b.active ? 1 : -1;
    });
  }


  public toggleLanguage() {
    this.openedLngList = !this.openedLngList;
  }

  public setLanguage(lng) {
    this.translator.use(lng);
  }


  public openAuth() {
    this.userService.openAuthForm().then(() => { }, () => { });
  }

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.routeLinkPage = this.router.url;
    });
  }

  public openLogoutConfirmation() {
    this.logoutConfirmationModal = this.dialog.open(this.logoutConfirmation, {
      width: '480px',
      panelClass: 'custom-dialog-container'
    });
  }

  public logoutSuccess() {
    this.logoutProgress = true;
    this.userService.logout().then(() => {
      this.logoutConfirmationModal.close();
    }).finally(() => {
      this.logoutProgress = false;
      this.currentUser.is_ghost = true;
      window.location.reload();
    });
  }

}
