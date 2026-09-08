import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'team-select',
    pathMatch: 'full'
  },
  {
    path: 'team-select',
    loadComponent: () =>
      import('./pages/team-select/team-select.page').then((m) => m.TeamSelectPage)
  },
  {
    path: 'teams',
    loadComponent: () => import('./pages/teams/teams.page').then((m) => m.TeamsPage)
  },
  {
    path: 'story',
    loadComponent: () => import('./pages/story/story.page').then((m) => m.StoryPage)
  },
  {
    path: 'battle',
    loadComponent: () =>
      import('./pages/battle/battle.page').then((m) => m.BattlePage)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage)
  }
];
