import { Fx } from './fx';

describe('Fx.rect', () => {
  let field: HTMLElement;
  let child: HTMLElement;

  beforeEach(() => {
    field = document.createElement('div');
    field.className = 'field';
    field.style.cssText = 'position:absolute;left:0;top:0;width:640px;height:300px;transform-origin:top left';
    child = document.createElement('div');
    child.style.cssText = 'position:absolute;left:100px;top:50px;width:40px;height:20px';
    field.appendChild(child);
    document.body.appendChild(field);
  });

  afterEach(() => field.remove());

  it('measures in field pixels when the field is zoomed', () => {
    field.style.scale = '2';
    const f = Fx.rect(field);
    const r = Fx.rect(child);
    expect(f.width).toBeCloseTo(640, 1);
    expect(r.left - f.left).toBeCloseTo(100, 1);
    expect(r.top - f.top).toBeCloseTo(50, 1);
    expect(r.width).toBeCloseTo(40, 1);
    expect(Fx.centerOf(child, field).x).toBeCloseTo(120, 1);
  });

  it('matches getBoundingClientRect when the field is not zoomed', () => {
    expect(Fx.rect(child).width).toBe(child.getBoundingClientRect().width);
  });
});
