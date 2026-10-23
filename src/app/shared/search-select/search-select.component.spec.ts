import { SearchOption, filterOptions } from './search-select.component';

describe('filterOptions', () => {
  const opts: SearchOption[] = [
    { id: 'flamethrower', label: 'Flammenwurf', hint: 'Fire' },
    { id: 'ember', label: 'Glut', hint: 'Fire' },
    { id: 'wingattack', label: 'Flügelschlag', hint: 'Flying' },
    { id: 'tackle', label: 'Tackle', hint: 'Normal' }
  ];

  it('returns everything (up to the limit) for an empty query', () => {
    expect(filterOptions(opts, '  ').length).toBe(4);
    expect(filterOptions(opts, '', 2).map((o) => o.id)).toEqual(['flamethrower', 'ember']);
  });

  it('matches label case-insensitively, label-prefix matches first', () => {
    expect(filterOptions(opts, 'FL').map((o) => o.id)).toEqual(['flamethrower', 'wingattack']);
    expect(filterOptions(opts, 'schlag').map((o) => o.id)).toEqual(['wingattack']);
  });

  it('also matches the hint', () => {
    expect(filterOptions(opts, 'fire').map((o) => o.id)).toEqual(['flamethrower', 'ember']);
  });
});
