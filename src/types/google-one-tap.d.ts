/**
 * Minimal type declarations for Google Identity Services (One Tap).
 * Only the three methods used by our GoogleOneTap component are declared.
 * @see https://developers.google.com/identity/gsi/web/reference/js-reference
 */

declare global {
  interface GoogleAccountsIdConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: "signin" | "signup" | "use";
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
    nonce?: string;
  }

  interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
    clientId?: string;
  }

  interface GoogleAccountsId {
    initialize: (config: GoogleAccountsIdConfig) => void;
    prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
    cancel: () => void;
  }

  interface GooglePromptNotification {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
    getDismissedReason: () => string;
  }

  interface GoogleAccounts {
    id: GoogleAccountsId;
  }

  interface Google {
    accounts: GoogleAccounts;
  }

  interface Window {
    google?: Google;
  }
}

export {};
