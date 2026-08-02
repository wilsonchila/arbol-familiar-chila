export const CONFIG = {
  GOOGLE_CLIENT_ID: '457056775461-au2e0giq7jsrb8ni5a8pgsj7kovup78s.apps.googleusercontent.com',
  SHEET_ID: '1fiiuOar2Ih9yotoJRIsDwV4cZxWdb19KrSdNdyOa1F8',
  ADMIN_EMAIL: 'wilsonchila45@gmail.com',
  ADMIN_EMAILS: ['wilsonchila45@gmail.com','operaciones@sunnybotics.com'],
  SHEET_NAME: 'Arbol Familiar Chila',
  SUGGESTIONS_SHEET: 'Sugerencias',
  CHAT_SHEET: 'ChatMensajes',
  EDITOR_EMAILS: ['holman2chila@gmail.com'],
  EMAILJS_SERVICE_ID: 'service_ktcolow',
  EMAILJS_TEMPLATE_ID: 'template_s3b7wft',
  EMAILJS_PUBLIC_KEY: 'kgYe9t-olKxqB54Z2',
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ')
};

export const FIELDS = {
  ID: 'id',
  FIRST_NAME: 'firstName',
  PATERNAL_LAST_NAME: 'paternalLastName',
  MATERNAL_LAST_NAME: 'maternalLastName',
  BIRTH_DATE: 'birthDate',
  DEATH_DATE: 'deathDate',
  GENDER: 'gender',
  EMAIL: 'email',
  PHONE: 'phone',
  ADDRESS: 'address',
  PHOTO_URL: 'photoUrl',
  IS_ALIVE: 'isAlive',
  NOTES: 'notes',
  PARENT_IDS: 'parentIds',
  SPOUSE_IDS: 'spouseIds',
  GENERATION: 'generation',
  WIFE_NUMBER: 'wifeNumber',
  CREATED_BY: 'createdBy',
  CREATED_AT: 'createdAt',
  STATUS: 'status',
  FATHER_NAME: 'fatherName',
  MOTHER_NAME: 'motherName'
};

export const FIELDS_ARRAY = Object.values(FIELDS);
