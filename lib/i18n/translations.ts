export type Lang = "sk" | "en" | "de"

export const translations = {
  sk: {
    appName: "Worktime", orchestra: "Slovenská filharmónia", practice: "Cvičenie", concerts: "Koncerty", todayWorked: "Dnes odpracované",
    signIn: "Prihlásiť sa", signUp: "Registrovať sa", signOut: "Odhlásiť sa", welcomeBack: "Vitajte späť", createAccount: "Vytvoriť účet", signInSubtitle: "Prihláste sa do evidencie pracovného času", signUpSubtitle: "Zaregistrujte sa a začnite s evidenciou", name: "Meno a priezvisko", email: "E-mail", password: "Heslo", haveAccount: "Už máte účet?", noAccount: "Nemáte účet?", pleaseWait: "Prosím čakajte...", somethingWrong: "Niečo sa pokazilo",
    dashboard: "Prehľad", schedule: "Plán práce", calendar: "Kalendár", timesheet: "EPČ", videos: "Koncerty", profile: "Profil",
    goodDay: "Dobrý deň", today: "Dnes", monthOverview: "Prehľad mesiaca", hoursThisMonth: "hodín", activitiesThisMonth: "skúšok", upcomingActivities: "Nadchádzajúce aktivity", recentEntries: "Posledné záznamy", noUpcoming: "Žiadne nadchádzajúce aktivity", noEntries: "Zatiaľ žiadne záznamy", viewSchedule: "Zobraziť plán práce", viewTimesheet: "Zobraziť EPČ", logged: "zaznamenané", scheduled: "naplánované",
    seasonSchedule: "Plán práce", seasonSubtitle: "Pracovný plán orchestra na sezónu 2026/2027", seedSeason: "Načítať sezónny plán", seeding: "Načítavam...", logHours: "Zaznamenať hodiny", logged2: "Zaznamenané", allTypes: "Všetko",
    monthlyRecord: "EPČ", timesheetSubtitle: "Evidencia pracovného času", totalHours: "Celkom hodín", date: "Dátum", activity: "Aktivita", type: "Typ", hours: "Hodiny", status: "Stav", actions: "Akcie", noRecords: "Žiadne záznamy pre tento mesiac", export: "Exportovať",
    concertVideos: "Koncerty", videosSubtitle: "Archív koncertov a záznamov Slovenskej filharmónie", watch: "Pozrieť", noVideos: "Zatiaľ žiadne koncerty", addVideo: "Pridať koncert",
    myProfile: "Profil", profileSubtitle: "Osobné a orchestrálne údaje", fullName: "Meno a priezvisko", instrument: "Nástroj", section: "Sekcia", position: "Pozícia", phone: "Telefón", save: "Uložiť", saving: "Ukladám...", saved: "Uložené",
    type_rehearsal: "Skúška", type_concert: "Koncert", type_recording: "Nahrávanie", type_dress: "Generálka", type_off: "Voľno", type_ip: "Individuálna príprava", type_other: "Iné",
    status_present: "Prítomný", status_absent: "Neprítomný", status_excused: "Ospravedlnený", logDialogTitle: "Zaznamenať pracovný čas", logDialogDesc: "Potvrďte účasť a počet odpracovaných hodín.", notes: "Poznámka", cancel: "Zrušiť", confirm: "Potvrdiť", delete: "Odstrániť",
    months: ["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"], weekdays: ["Po","Ut","St","Št","Pi","So","Ne"],
  },
  en: {
    appName: "Worktime", orchestra: "Slovak Philharmonic", practice: "Practice", concerts: "Concerts", todayWorked: "Worked today",
    signIn: "Sign in", signUp: "Sign up", signOut: "Sign out", welcomeBack: "Welcome back", createAccount: "Create account", signInSubtitle: "Sign in to your work-hour records", signUpSubtitle: "Sign up to start tracking your hours", name: "Full name", email: "Email", password: "Password", haveAccount: "Already have an account?", noAccount: "Don't have an account?", pleaseWait: "Please wait...", somethingWrong: "Something went wrong",
    dashboard: "Home", schedule: "Schedule", calendar: "Calendar", timesheet: "EPČ", videos: "Concerts", profile: "Profile",
    goodDay: "Good evening", today: "Today", monthOverview: "Month overview", hoursThisMonth: "hours", activitiesThisMonth: "rehearsals", upcomingActivities: "Upcoming activities", recentEntries: "Recent entries", noUpcoming: "No upcoming activities", noEntries: "No entries yet", viewSchedule: "View schedule", viewTimesheet: "View EPČ", logged: "logged", scheduled: "scheduled",
    seasonSchedule: "Schedule", seasonSubtitle: "Orchestra work plan for the 2026/2027 season", seedSeason: "Load season plan", seeding: "Loading...", logHours: "Log hours", logged2: "Logged", allTypes: "All",
    monthlyRecord: "EPČ", timesheetSubtitle: "Work time record", totalHours: "Total hours", date: "Date", activity: "Activity", type: "Type", hours: "Hours", status: "Status", actions: "Actions", noRecords: "No records for this month", export: "Export",
    concertVideos: "Concerts", videosSubtitle: "Archive of Slovak Philharmonic concerts and recordings", watch: "Watch", noVideos: "No concerts yet", addVideo: "Add concert",
    myProfile: "Profile", profileSubtitle: "Personal and orchestral details", fullName: "Full name", instrument: "Instrument", section: "Section", position: "Position", phone: "Phone", save: "Save", saving: "Saving...", saved: "Saved",
    type_rehearsal: "Rehearsal", type_concert: "Concert", type_recording: "Recording", type_dress: "Dress rehearsal", type_off: "Day off", type_ip: "Individual prep", type_other: "Other",
    status_present: "Present", status_absent: "Absent", status_excused: "Excused", logDialogTitle: "Log work time", logDialogDesc: "Confirm attendance and the number of worked hours.", notes: "Notes", cancel: "Cancel", confirm: "Confirm", delete: "Delete",
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"], weekdays: ["Mo","Tu","We","Th","Fr","Sa","Su"],
  },
  de: {
    appName: "Worktime", orchestra: "Slowakische Philharmonie", practice: "Üben", concerts: "Konzerte", todayWorked: "Heute gearbeitet",
    signIn: "Anmelden", signUp: "Registrieren", signOut: "Abmelden", welcomeBack: "Willkommen zurück", createAccount: "Konto erstellen", signInSubtitle: "Zur Arbeitszeiterfassung anmelden", signUpSubtitle: "Registrieren und Arbeitszeit erfassen", name: "Vor- und Nachname", email: "E-Mail", password: "Passwort", haveAccount: "Bereits ein Konto?", noAccount: "Noch kein Konto?", pleaseWait: "Bitte warten...", somethingWrong: "Etwas ist schiefgelaufen",
    dashboard: "Übersicht", schedule: "Dienstplan", calendar: "Kalender", timesheet: "EPČ", videos: "Konzerte", profile: "Profil",
    goodDay: "Guten Tag", today: "Heute", monthOverview: "Monatsübersicht", hoursThisMonth: "Stunden", activitiesThisMonth: "Proben", upcomingActivities: "Nächste Termine", recentEntries: "Letzte Einträge", noUpcoming: "Keine bevorstehenden Termine", noEntries: "Noch keine Einträge", viewSchedule: "Dienstplan anzeigen", viewTimesheet: "EPČ anzeigen", logged: "erfasst", scheduled: "geplant",
    seasonSchedule: "Dienstplan", seasonSubtitle: "Arbeitsplan des Orchesters für die Saison 2026/2027", seedSeason: "Saisonplan laden", seeding: "Lädt...", logHours: "Stunden erfassen", logged2: "Erfasst", allTypes: "Alle",
    monthlyRecord: "EPČ", timesheetSubtitle: "Arbeitszeiterfassung", totalHours: "Gesamtstunden", date: "Datum", activity: "Aktivität", type: "Typ", hours: "Stunden", status: "Status", actions: "Aktionen", noRecords: "Keine Einträge für diesen Monat", export: "Exportieren",
    concertVideos: "Konzerte", videosSubtitle: "Archiv der Konzerte und Aufnahmen der Slowakischen Philharmonie", watch: "Ansehen", noVideos: "Noch keine Konzerte", addVideo: "Konzert hinzufügen",
    myProfile: "Profil", profileSubtitle: "Persönliche und orchestrale Angaben", fullName: "Vor- und Nachname", instrument: "Instrument", section: "Stimmgruppe", position: "Position", phone: "Telefon", save: "Speichern", saving: "Speichert...", saved: "Gespeichert",
    type_rehearsal: "Probe", type_concert: "Konzert", type_recording: "Aufnahme", type_dress: "Generalprobe", type_off: "Frei", type_ip: "Individuelle Vorbereitung", type_other: "Sonstiges",
    status_present: "Anwesend", status_absent: "Abwesend", status_excused: "Entschuldigt", logDialogTitle: "Arbeitszeit erfassen", logDialogDesc: "Anwesenheit und Arbeitsstunden bestätigen.", notes: "Notiz", cancel: "Abbrechen", confirm: "Bestätigen", delete: "Löschen",
    months: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"], weekdays: ["Mo","Di","Mi","Do","Fr","Sa","So"],
  },
} as const

export type TranslationKey = keyof (typeof translations)["en"]
