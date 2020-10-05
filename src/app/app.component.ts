import {Component, OnInit} from '@angular/core';
import {UserService} from './services/user/user.service';
import {CostService} from './services/costs/costs.service';
import {CookieService} from 'ngx-cookie-service';
import {ActivationEnd, NavigationStart, Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'mywish-token-protector';

  public hideInstructionLink;
  public visibleWatchButton;
  public notCookiesAccept: boolean;
  public withHeader: boolean;

  constructor(
    private userService: UserService,
    private router: Router,
    private cookieService: CookieService,
    private costService: CostService
  ) {

    const body = document.getElementsByTagName('body')[0];
    this.router.events.subscribe((event) => {

      if (event instanceof ActivationEnd) {
        this.withHeader = !event.snapshot.data.noheader;

        if (!event.snapshot.firstChild) {
          if (event.snapshot.data.support) {
            this.hideInstructionLink = event.snapshot.data.supportHide;
            this.visibleWatchButton = !event.snapshot.data.hideInstruction;
            body.classList.add('with-support');
            body.classList.remove('without-support');
            event.snapshot.data.supportHide ? body.classList.add('support-hide-' + event.snapshot.data.supportHide) : '';
          } else {
            body.classList.remove('with-support');
            body.classList.add('without-support');
            this.visibleWatchButton = false;
          }
        }
      }

      this.notCookiesAccept = !this.cookieService.get('cookies-accept');
    });
  }

  public closeCookiesInfo(withoutCookie) {
    if (!withoutCookie) {
      this.cookieService.set('cookies-accept', '1');
    }
    this.notCookiesAccept = false;
  }

  private checkLiveChat() {

    const liveChatButtonFrame = document.getElementById('livechat-compact-view');
    const liveChatContainer = document.getElementById('livechat-compact-container');

    if (!liveChatButtonFrame) {
      setTimeout(() => {
        this.checkLiveChat();
      });
      return;
    }

    const mutationObserver = new window['MutationObserver']((res) => {
      liveChatContainer.removeAttribute('style');
    });
    mutationObserver.observe(liveChatContainer, {
      attributes: true,
      attributeFilter: ['style']
    });
    liveChatContainer.removeAttribute('style');

    const frameContent = liveChatButtonFrame['contentWindow'] || liveChatButtonFrame['contentDocument'];
    const frameContentContainer = frameContent.document.getElementById('content-container');

    frameContentContainer.setAttribute('style', 'padding: 0 !important');
    frameContent.document.getElementById('full-view-button').style.height = '100%';
  }

  ngOnInit(): void {
    let visibilityEvent;
    let visibilityAttr;

    if (typeof document.hidden !== 'undefined') {
      visibilityAttr = 'hidden';
      visibilityEvent = 'visibilitychange';
    } else if (typeof document['msHidden'] !== 'undefined') {
      visibilityAttr = 'msHidden';
      visibilityEvent = 'msvisibilitychange';
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      visibilityAttr = 'webkitHidden';
      visibilityEvent = 'webkitvisibilitychange';
    }

    if (typeof document.addEventListener === 'undefined' || visibilityAttr === undefined) {
      console.log('This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.');
    } else {
      document.addEventListener(visibilityEvent, () => {
        if (!document[visibilityAttr]) {
          this.userService.updateUser();
        }
      }, false);
    }

    this.costService.loadCosts();

    this.checkLiveChat();
  }
}
