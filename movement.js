import { Box2, Vector2 } from './lab/vendor/three-r160/three.module.min.js';

const radius = 0.24;
const gravity = 20;
const jumpSpeed = 5.56;
const room = new Box2(new Vector2(-5.6, -7.2), new Vector2(5.6, 6.5)).expandByScalar(-radius);

export function createWalker(obstacles, x = 0, z = 6.12) {
  const props = obstacles.map(({ minX, minZ, maxX, maxZ, top }) => ({
    area: new Box2(new Vector2(minX, minZ), new Vector2(maxX, maxZ)).expandByScalar(radius),
    top,
  }));
  const probe = new Vector2();
  const player = { x, z, height: 0, grounded: true, stride: 'idle' };
  let vy = 0;

  function clear(px, pz) {
    probe.set(px, pz);
    return room.containsPoint(probe) && !props.some(({ area, top }) => player.height < top && area.containsPoint(probe));
  }

  function jump() {
    if (!player.grounded) return;
    player.grounded = false;
    vy = jumpSpeed;
  }

  function advance(dt, lateral, forward, yaw, sprint, crouch) {
    const moving = lateral !== 0 || forward !== 0;
    const running = moving && sprint && !crouch && forward > 0.12;
    const speed = crouch ? 1.15 : running ? 4.35 : 2.75;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const dx = speed * (lateral * cos - forward * sin);
    const dz = speed * (-lateral * sin - forward * cos);
    player.stride = crouch ? 'crouch' : running ? 'sprint' : moving ? 'walk' : 'idle';

    // Small steps keep a low-frame-rate jump from missing the top of a stool.
    while (dt > 0) {
      const step = Math.min(dt, 1 / 120);
      dt -= step;
      const oldHeight = player.height;
      if (!player.grounded) {
        player.height = oldHeight + vy * step - gravity * step * step / 2;
        vy -= gravity * step;
      }
      // Resolve the horizontal sweep at the higher of the two foot positions.
      // On descent, the landing test below resolves any top crossed this step.
      const nextHeight = player.height;
      player.height = Math.max(oldHeight, nextHeight);
      if (clear(player.x + dx * step, player.z)) player.x += dx * step;
      if (clear(player.x, player.z + dz * step)) player.z += dz * step;
      player.height = nextHeight;

      if (vy <= 0) {
        probe.set(player.x, player.z);
        let floor = 0;
        for (const { area, top } of props) {
          if (oldHeight >= top && area.containsPoint(probe)) floor = Math.max(floor, top);
        }
        player.grounded = player.height <= floor;
        if (player.grounded) {
          player.height = floor;
          vy = 0;
        }
      }
    }
  }

  return { player, jump, advance };
}
