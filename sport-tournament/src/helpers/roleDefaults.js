export const roleDefaults = {
  "Super Admin": {
    Events: { view: true, create: true, edit: true, delete: true },
    Venues: { view: true, create: true, edit: true, delete: true },
    Sports: { view: true, create: true, edit: true, delete: true },
    Players: { view: true, create: true, edit: true, delete: true },
    Teams: { view: true, create: true, edit: true, delete: true },
    "Franchise Panel": { view: true, create: true, edit: true, delete: true },
    "Scoring Panel": { view: true, create: true, edit: true, delete: true },
    "Commentary Panel": { view: true, create: true, edit: true, delete: true }
  },

  "Admin": {
    Events: { view: true, create: true, edit: true, delete: true },
    Venues: { view: true, create: true, edit: true, delete: true },
    Sports: { view: true, create: true, edit: true, delete: true },
    Players: { view: true, create: true, edit: true, delete: true },
    Teams: { view: true, create: true, edit: true, delete: true },
    "Franchise Panel": { view: true, create: true, edit: true, delete: true },
    "Scoring Panel": { view: true, create: true, edit: true, delete: true },
    "Commentary Panel": { view: true, create: true, edit: true, delete: true }
  },

  "Scorer": {
    Events: { view: true, create: false, edit: false, delete: false },
    Venues: { view: true, create: false, edit: false, delete: false },
    Sports: { view: true, create: false, edit: false, delete: false },
    Players: { view: true, create: false, edit: false, delete: false },
    Teams: { view: true, create: false, edit: false, delete: false },
    "Franchise Panel": { view: true, create: false, edit: false, delete: false },

    // Scorer special
    "Scoring Panel": { view: true, create: false, edit: true, delete: false },

    "Commentary Panel": { view: false, create: false, edit: false, delete: false }
  },

  "Commentator": {
    Events: { view: true, create: false, edit: false, delete: false },
    Venues: { view: true, create: false, edit: false, delete: false },
    Sports: { view: true, create: false, edit: false, delete: false },
    Players: { view: true, create: false, edit: false, delete: false },
    Teams: { view: true, create: false, edit: false, delete: false },
    "Franchise Panel": { view: false, create: false, edit: false, delete: false },
    "Scoring Panel": { view: false, create: false, edit: false, delete: false },

    // Commentator special
    "Commentary Panel": { view: true, create: true, edit: true, delete: false }
  },

  "Team Manager": {
    Events: { view: true, create: false, edit: false, delete: false },
    Venues: { view: true, create: false, edit: false, delete: false },
    Sports: { view: true, create: false, edit: false, delete: false },

    // Team Manager special
    Players: { view: true, create: true, edit: true, delete: false },
    Teams: { view: true, create: true, edit: true, delete: false },

    "Franchise Panel": { view: false, create: false, edit: false, delete: false },
    "Scoring Panel": { view: false, create: false, edit: false, delete: false },
    "Commentary Panel": { view: false, create: false, edit: false, delete: false }
  },

  "Read-Only": {
    Events: { view: true, create: false, edit: false, delete: false },
    Venues: { view: true, create: false, edit: false, delete: false },
    Sports: { view: true, create: false, edit: false, delete: false },
    Players: { view: true, create: false, edit: false, delete: false },
    Teams: { view: true, create: false, edit: false, delete: false },
    "Franchise Panel": { view: true, create: false, edit: false, delete: false },
    "Scoring Panel": { view: true, create: false, edit: false, delete: false },
    "Commentary Panel": { view: true, create: false, edit: false, delete: false }
  }
};
