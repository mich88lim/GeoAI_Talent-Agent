export interface Translations {
  common: {
    appName: string
    tagline: string
    language: string
    english: string
    malay: string
    loading: string
    error: string
    success: string
    save: string
    cancel: string
    confirm: string
    back: string
    signOut: string
  }
  auth: {
    loginTitle: string
    loginSubtitle: string
    registerTitle: string
    registerSubtitle: string
    forgotPassword: string
    resetPasswordTitle: string
    resetPasswordSubtitle: string
    resetPasswordSent: string
    updatePasswordTitle: string
    updatePasswordSubtitle: string
    emailLabel: string
    passwordLabel: string
    newPasswordLabel: string
    confirmPasswordLabel: string
    fullNameLabel: string
    signIn: string
    register: string
    sendResetLink: string
    updatePassword: string
    noAccount: string
    haveAccount: string
    backToLogin: string
    emailNotAllowed: string
    checkEmail: string
    passwordsNoMatch: string
    passwordTooShort: string
    emailInvalid: string
    domainHint: string
  }
  approval: {
    title: string
    message: string
    contactAdmin: string
    signOut: string
  }
  dashboard: {
    title: string
    welcome: string
    subtitle: string
    comingSoon: string
  }
  admin: {
    usersTitle: string
    usersSubtitle: string
    pendingUsers: string
    activeUsers: string
    allUsers: string
    approve: string
    suspend: string
    changeRole: string
    role: string
    status: string
    district: string
    email: string
    name: string
    joinedAt: string
    noPending: string
    approveModal: string
    approveDescription: string
    districtLabel: string
    roleAdmin: string
    roleUser: string
    lastAdminError: string
    mfaNote: string
    mfaInstructions: string
  }
}

export const en: Translations = {
  common: {
    appName: 'GEO-TALENT AGENT',
    tagline: 'Sarawak State Education Department · ICT Unit',
    language: 'Language',
    english: 'English',
    malay: 'Bahasa Melayu',
    loading: 'Loading…',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    signOut: 'Sign out',
  },
  auth: {
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to your account to continue.',
    registerTitle: 'Create account',
    registerSubtitle: 'Request access to the GEO-TALENT AGENT platform.',
    forgotPassword: 'Forgot password?',
    resetPasswordTitle: 'Reset password',
    resetPasswordSubtitle: "Enter your email and we'll send you a reset link.",
    resetPasswordSent: 'Check your email for the password reset link.',
    updatePasswordTitle: 'Set new password',
    updatePasswordSubtitle: 'Enter a new password for your account.',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm new password',
    fullNameLabel: 'Full name',
    signIn: 'Sign in',
    register: 'Request access',
    sendResetLink: 'Send reset link',
    updatePassword: 'Update password',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    backToLogin: 'Back to sign in',
    emailNotAllowed:
      'This email address is not permitted to register. Please use your official MOE email address or contact an administrator.',
    checkEmail: 'Please check your email to verify your account before signing in.',
    passwordsNoMatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 8 characters.',
    emailInvalid: 'Please enter a valid email address.',
    domainHint: 'Use your official @moe.gov.my email, or contact an administrator.',
  },
  approval: {
    title: 'Account pending approval',
    message:
      'Your account has been created and is awaiting administrator approval. You will be notified by email once your account has been approved.',
    contactAdmin: 'If you need urgent access, please contact your PPD or JPN administrator.',
    signOut: 'Sign out',
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome,',
    subtitle: 'GEO-TALENT AGENT — Geospatial Master Trainer Recommendation Platform',
    comingSoon: 'The map dashboard will be available in the next phase.',
  },
  admin: {
    usersTitle: 'User management',
    usersSubtitle: 'Approve pending accounts and manage user roles.',
    pendingUsers: 'Pending approval',
    activeUsers: 'Active users',
    allUsers: 'All users',
    approve: 'Approve',
    suspend: 'Suspend',
    changeRole: 'Change role',
    role: 'Role',
    status: 'Status',
    district: 'District',
    email: 'Email',
    name: 'Name',
    joinedAt: 'Joined',
    noPending: 'No pending accounts.',
    approveModal: 'Approve account',
    approveDescription: 'Set the role and district for this user.',
    districtLabel: 'Assign district',
    roleAdmin: 'Administrator (JPN)',
    roleUser: 'Standard user (PPD / School)',
    lastAdminError: 'Cannot change: this is the last active administrator.',
    mfaNote: 'Administrator MFA setup',
    mfaInstructions:
      'To enable MFA for admin accounts: go to Supabase Dashboard → Authentication → Policies and enable "Enforce MFA for admin users". Admins can then set up TOTP in their account settings.',
  },
}
