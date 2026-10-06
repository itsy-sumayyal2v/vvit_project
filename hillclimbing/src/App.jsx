import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Flag, Gauge, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react';

const freshGame = () => ({
  distance: 0,
  speed: 0,
  y: 0,
  velocityY: 0,
  angle: 0,
  angularVelocity: 0,
  fuel: 100,
  coins: 0,
  collected: new Set(),
  paused: false,
  finished: false,
  endReason: '',
});

async function fetchLeaderboardData() {
  const response = await fetch('/api/leaderboard');
  if (!response.ok) throw new Error('Could not load the leaderboard.');
  return response.json();
}

const terrainY = (distance, height) =>
  height * 0.69 + Math.sin(distance * 0.073) * 25 + Math.sin(distance * 0.031 + 1.3) * 29 + Math.sin(distance * 0.15) * 6;

function drawCar(context, x, y, angle) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);

  context.fillStyle = 'rgba(34, 44, 36, 0.18)';
  context.beginPath();
  context.ellipse(2, 15, 43, 8, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#26332d';
  for (const wheelX of [-25, 25]) {
    context.beginPath();
    context.arc(wheelX, 10, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#d1d8c9';
    context.beginPath();
    context.arc(wheelX, 10, 4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#26332d';
  }

  context.fillStyle = '#d85b3f';
  context.beginPath();
  context.moveTo(-39, 4);
  context.lineTo(-35, -10);
  context.lineTo(-20, -13);
  context.lineTo(-10, -27);
  context.lineTo(14, -27);
  context.lineTo(27, -12);
  context.lineTo(37, -9);
  context.lineTo(40, 4);
  context.closePath();
  context.fill();
  context.fillStyle = '#f1b16c';
  context.fillRect(-10, -24, 12, 10);
  context.fillStyle = '#f7e1ad';
  context.fillRect(4, -24, 8, 10);
  context.fillStyle = '#f1d9a8';
  context.fillRect(31, -6, 5, 4);
  context.fillStyle = '#a33e32';
  context.fillRect(-30, -4, 28, 4);
  context.fillStyle = '#f3dfb8';
  context.font = '700 8px monospace';
  context.fillText('07', -26, -6);

  context.strokeStyle = '#26332d';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-17, -29);
  context.lineTo(19, -29);
  context.stroke();
  context.restore();
}

function drawPickup(context, x, y, kind) {
  context.save();
  context.translate(x, y);
  if (kind === 'coin') {
    context.fillStyle = '#f1bd57';
    context.beginPath();
    context.arc(0, 0, 9, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#fff0bd';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, 5, 0, Math.PI * 2);
    context.stroke();
  } else {
    context.fillStyle = '#f0eee0';
    context.beginPath();
    context.roundRect(-8, -11, 16, 23, 3);
    context.fill();
    context.fillStyle = '#d85b3f';
    context.fillRect(-4, -7, 8, 9);
    context.fillStyle = '#f0eee0';
    context.fillRect(-1, -5, 2, 5);
    context.fillRect(-3, -3, 6, 2);
  }
  context.restore();
}

function drawScene(context, width, height, game, scale) {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#bed5c9');
  sky.addColorStop(0.68, '#e4dfbd');
  sky.addColorStop(1, '#edcf9b');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#f0bd6e';
  context.beginPath();
  context.arc(width * 0.79, height * 0.22, Math.min(width, height) * 0.065, 0, Math.PI * 2);
  context.fill();

  for (let layer = 0; layer < 3; layer += 1) {
    const base = height * (0.53 + layer * 0.055);
    const amplitude = 28 + layer * 18;
    context.beginPath();
    context.moveTo(0, height);
    for (let x = 0; x <= width + 12; x += 12) {
      const world = game.distance + (x - width * 0.32) / scale;
      const ridge = base + Math.sin(world * (0.022 - layer * 0.003) + layer * 2.3) * amplitude;
      context.lineTo(x, ridge);
    }
    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = ['#a6bca7', '#839f8a', '#68866f'][layer];
    context.fill();
  }

  const carX = width * 0.32;
  const startWorld = game.distance - carX / scale;
  const endWorld = game.distance + (width - carX) / scale;
  const groundPath = new Path2D();
  groundPath.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const world = game.distance + (x - carX) / scale;
    groundPath.lineTo(x, terrainY(world, height));
  }
  groundPath.lineTo(width, height);
  groundPath.closePath();
  context.fillStyle = '#627b4f';
  context.fill(groundPath);

  context.beginPath();
  for (let x = 0; x <= width + 8; x += 8) {
    const world = game.distance + (x - carX) / scale;
    const y = terrainY(world, height);
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = '#455c3d';
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = '#a9ad76';
  context.lineWidth = 1.5;
  context.stroke();

  const firstMarker = Math.floor(startWorld / 55) - 1;
  const lastMarker = Math.ceil(endWorld / 55) + 1;
  for (let marker = firstMarker; marker <= lastMarker; marker += 1) {
    const world = marker * 55 + 28;
    const screenX = carX + (world - game.distance) * scale;
    if (screenX < -20 || screenX > width + 20) continue;
    const y = terrainY(world, height) - 47;
    if (!game.collected.has(`coin-${marker}`)) drawPickup(context, screenX, y, 'coin');
  }

  const firstCan = Math.floor(startWorld / 220) - 1;
  const lastCan = Math.ceil(endWorld / 220) + 1;
  for (let marker = firstCan; marker <= lastCan; marker += 1) {
    const world = marker * 220 + 105;
    const screenX = carX + (world - game.distance) * scale;
    if (screenX < -20 || screenX > width + 20) continue;
    const y = terrainY(world, height) - 54;
    if (!game.collected.has(`fuel-${marker}`)) drawPickup(context, screenX, y, 'fuel');
  }

  const firstBoulder = Math.floor((startWorld + 90) / 240);
  const lastBoulder = Math.floor((endWorld + 90) / 240);
  for (let marker = firstBoulder; marker <= lastBoulder; marker += 1) {
    const world = marker * 240 + 150;
    const screenX = carX + (world - game.distance) * scale;
    if (screenX < -42 || screenX > width + 42) continue;
    const ground = terrainY(world, height);
    context.fillStyle = '#634b3b';
    context.beginPath();
    context.moveTo(screenX - 24, ground);
    context.lineTo(screenX - 18, ground - 14);
    context.lineTo(screenX - 8, ground - 24);
    context.lineTo(screenX + 8, ground - 21);
    context.lineTo(screenX + 22, ground - 9);
    context.lineTo(screenX + 25, ground);
    context.closePath();
    context.fill();
    context.fillStyle = '#967356';
    context.beginPath();
    context.moveTo(screenX - 12, ground - 16);
    context.lineTo(screenX - 7, ground - 23);
    context.lineTo(screenX + 6, ground - 20);
    context.lineTo(screenX + 1, ground - 14);
    context.closePath();
    context.fill();
  }

  for (let index = Math.floor(startWorld / 14); index < endWorld / 14; index += 1) {
    const world = index * 14 + 6;
    const screenX = carX + (world - game.distance) * scale;
    const ground = terrainY(world, height);
    const size = 5 + Math.abs(Math.sin(index * 3.71)) * 7;
    context.fillStyle = index % 2 ? '#334d39' : '#d8bd78';
    context.beginPath();
    context.moveTo(screenX, ground - 4);
    context.lineTo(screenX + size * 0.55, ground - size - 4);
    context.lineTo(screenX + size, ground - 4);
    context.fill();
  }

  const base = terrainY(game.distance, height);
  if (!game.y) game.y = base - 27;
  drawCar(context, carX, game.y, game.angle);

  context.fillStyle = 'rgba(42, 56, 42, 0.56)';
  context.font = '600 10px monospace';
  context.fillText('NORTH RIDGE  /  SECTOR 04', 22, height - 19);
}

function ControlButton({ label, icon: Icon, onDown, onUp, accent = false, jump = false }) {
  return (
    <button
      className={`control-button${accent ? ' control-button--accent' : ''}${jump ? ' control-button--jump' : ''}`}
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={label}
    >
      <Icon size={17} strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(freshGame());
  const controlsRef = useRef({ throttle: false, brake: false });
  const togglePauseRef = useRef(null);
  const jumpCarRef = useRef(null);
  const endRunRef = useRef(null);
  const [hud, setHud] = useState({ distance: 0, speed: 0, fuel: 100, coins: 0, paused: false, finished: false, endReason: '' });
  const [best, setBest] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [apiStatus, setApiStatus] = useState('connecting');
  const hudTimer = useRef(0);
  togglePauseRef.current = togglePause;
  jumpCarRef.current = jumpCar;

  useEffect(() => {
    let current = true;
    fetchLeaderboardData()
      .then((data) => {
        if (!current) return;
        setBest(data.personalBest ?? 0);
        setLeaderboard(data.runs ?? []);
        setApiStatus('online');
      })
      .catch(() => {
        if (current) setApiStatus('offline');
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let animationFrame = 0;
    let previousTime = 0;
    let pixelWidth = 0;
    let pixelHeight = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      pixelWidth = bounds.width;
      pixelHeight = bounds.height;
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const finish = (reason) => {
      const game = gameRef.current;
      if (game.finished) return;
      game.finished = true;
      game.endReason = reason;
      const record = Math.floor(game.distance);
      setApiStatus('syncing');
      fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: record, coins: game.coins, reason }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Could not save the race.');
          return fetchLeaderboardData();
        })
        .then((data) => {
          setBest(data.personalBest ?? 0);
          setLeaderboard(data.runs ?? []);
          setApiStatus('online');
        })
        .catch(() => setApiStatus('offline'));
    };
      endRunRef.current = finish;

    const frame = (time) => {
      const game = gameRef.current;
      const dt = Math.min((time - (previousTime || time)) / 1000, 0.035);
      previousTime = time;
      const scale = Math.max(7, Math.min(11, pixelWidth / 105));
      const ground = terrainY(game.distance, pixelHeight) - 27;
      if (!game.y) game.y = ground;

      if (!game.paused && !game.finished) {
        const { throttle, brake } = controlsRef.current;
        const drive = throttle && game.fuel > 0 ? 29 : 0;
        const stopping = brake ? 45 : 0;
        game.speed = Math.max(-7, Math.min(39, game.speed + (drive - stopping - game.speed * 1.25) * dt));
        game.distance = Math.max(0, game.distance + game.speed * dt);
        if (throttle && game.fuel > 0) game.fuel = Math.max(0, game.fuel - dt * 2.7);

        game.velocityY += 920 * dt;
        game.y += game.velocityY * dt;
        const nextGround = terrainY(game.distance, pixelHeight) - 27;
        const slope = Math.atan((terrainY(game.distance + 0.5, pixelHeight) - terrainY(game.distance - 0.5, pixelHeight)) / scale);
        const grounded = game.y >= nextGround;
        if (grounded) {
          game.y = nextGround;
          if (game.velocityY > 170) game.velocityY = -Math.min(game.velocityY * 0.18, 75);
          else game.velocityY = 0;
          game.angle += (slope - game.angle) * Math.min(1, dt * 10);
          game.angularVelocity *= 0.5;
        } else {
          game.angle += game.angularVelocity * dt;
          game.angularVelocity += ((throttle ? -1 : 0) + (brake ? 1 : 0)) * 0.95 * dt;
          game.angularVelocity *= 0.995;
        }

        const coinIndex = Math.round((game.distance - 28) / 55);
        const coinWorld = coinIndex * 55 + 28;
        if (coinIndex >= 0 && Math.abs(game.distance - coinWorld) < Math.max(0.8, game.speed * dt) && game.y < terrainY(coinWorld, pixelHeight) - 16) {
          const key = `coin-${coinIndex}`;
          if (!game.collected.has(key)) {
            game.collected.add(key);
            game.coins += 1;
          }
        }
        const fuelIndex = Math.round((game.distance - 105) / 220);
        const fuelWorld = fuelIndex * 220 + 105;
        if (fuelIndex >= 0 && Math.abs(game.distance - fuelWorld) < Math.max(0.8, game.speed * dt) && game.y < terrainY(fuelWorld, pixelHeight) - 17) {
          const key = `fuel-${fuelIndex}`;
          if (!game.collected.has(key)) {
            game.collected.add(key);
            game.fuel = Math.min(100, game.fuel + 34);
          }
        }

        const boulderIndex = Math.floor((game.distance + 90) / 240);
        const boulderWorld = boulderIndex * 240 + 150;
        const boulderClearance = terrainY(boulderWorld, pixelHeight) - 52;
        const collisionWindow = Math.max(4, Math.abs(game.speed) * dt + 2);
        if (Math.abs(game.distance - boulderWorld) < collisionWindow && game.y > boulderClearance && game.speed > 8) {
          finish('Boulder crash');
        }

        if (Math.abs(game.angle) > 1.28 || game.y > pixelHeight + 85) finish('Rollover');
        if (game.fuel <= 0 && Math.abs(game.speed) < 0.35) finish('Out of fuel');
      }

      drawScene(context, pixelWidth, pixelHeight, game, scale);
      hudTimer.current += dt;
      if (hudTimer.current > 0.1) {
        hudTimer.current = 0;
        setHud({
          distance: Math.max(0, Math.floor(game.distance)),
          speed: Math.round(Math.abs(game.speed) * 3.6),
          fuel: Math.round(game.fuel),
          coins: game.coins,
          paused: game.paused,
          finished: game.finished,
          endReason: game.endReason,
        });
      }
      animationFrame = window.requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrame = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return;
      if (event.code === 'ArrowRight' || event.code === 'KeyD' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        controlsRef.current.throttle = true;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        jumpCarRef.current?.();
      }
      if (event.code === 'ArrowLeft' || event.code === 'KeyA' || event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        controlsRef.current.brake = true;
      }
      if (event.code === 'Escape' || event.code === 'KeyP') togglePauseRef.current?.();
    };
    const onKeyUp = (event) => {
      if (['ArrowRight', 'KeyD', 'ArrowUp', 'KeyW'].includes(event.code)) controlsRef.current.throttle = false;
      if (['ArrowLeft', 'KeyA', 'ArrowDown', 'KeyS'].includes(event.code)) controlsRef.current.brake = false;
    };
    const clearControls = () => {
      controlsRef.current.throttle = false;
      controlsRef.current.brake = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearControls);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearControls);
    };
  }, []);

  function togglePause() {
    const game = gameRef.current;
    if (game.finished) return;
    game.paused = !game.paused;
    setHud((current) => ({ ...current, paused: game.paused }));
  }

  function jumpCar() {
    const game = gameRef.current;
    if (game.finished || game.paused) return;
    const height = canvasRef.current?.clientHeight || 480;
    const ground = terrainY(game.distance, height) - 27;
    if (game.y >= ground - 5 && game.velocityY >= -30) {
      game.velocityY = -490;
      game.y = ground - 2;
    }
  }

  function restart() {
    gameRef.current = freshGame();
    controlsRef.current = { throttle: false, brake: false };
    setHud({ distance: 0, speed: 0, fuel: 100, coins: 0, paused: false, finished: false, endReason: '' });
  }

  const fuelTone = hud.fuel < 24 ? 'fuel-meter__fill--low' : '';

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="wordmark" href="#track" aria-label="Ridge Runner home">
          <span className="wordmark__mark"><Flag size={18} strokeWidth={2.5} /></span>
          <span>RIDGE<span className="wordmark__light">RUNNER</span></span>
        </a>
        <div className="topbar__event"><span className="live-dot" /> CLUB RALLY <span className="topbar__slash">/</span> OPEN HEAT</div>
        <div className="topbar__record"><span>PERSONAL BEST</span><strong>{best.toLocaleString()} <small>M</small></strong></div>
      </header>

      <section className="race" id="track" aria-label="Hill climb game">
        <div className="race__heading">
          <div>
            <p className="eyebrow">STAGE 01 <span>/</span> NORTH RIDGE</p>
            <h1>Find your <em>line.</em></h1>
          </div>
          <div className="race__weather"><Sparkles size={15} /> CLEAR SKIES <span>18 C</span></div>
        </div>

        <div className="instrument-bar">
          <div className="instrument instrument--distance">
            <span className="instrument__label"><Flag size={13} /> DISTANCE</span>
            <strong>{hud.distance.toLocaleString()}<small> M</small></strong>
          </div>
          <div className="instrument instrument--speed">
            <span className="instrument__label"><Gauge size={13} /> SPEED</span>
            <strong>{hud.speed}<small> KM/H</small></strong>
          </div>
          <div className="instrument instrument--fuel">
            <span className="instrument__label">FUEL <small>{hud.fuel}%</small></span>
            <div className="fuel-meter"><span className={`fuel-meter__fill ${fuelTone}`} style={{ width: `${hud.fuel}%` }} /></div>
          </div>
          <div className="instrument instrument--coins">
            <span className="coin-glyph" aria-hidden="true" /><strong>{hud.coins.toString().padStart(2, '0')}</strong><small>COINS</small>
          </div>
          <button className="icon-button pause-button" type="button" onClick={togglePause} aria-label={hud.paused ? 'Resume race' : 'Pause race'} title={hud.paused ? 'Resume race' : 'Pause race'}>
            {hud.paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>

        <div className="track-frame">
          <canvas ref={canvasRef} className="track-canvas" aria-label="Driving game track. Hold the gas to climb and brake to slow down." />
          {(hud.paused || hud.finished) && (
            <div className="game-overlay">
              <div className="game-overlay__panel">
                <span className="game-overlay__kicker">{hud.finished ? 'GAME OVER' : 'PIT STOP'}</span>
                <h2>{hud.finished ? hud.endReason : 'Catch your breath.'}</h2>
                <p>{hud.finished ? `${hud.distance.toLocaleString()} meters · ${hud.coins} coins` : 'The ridge will wait.'}</p>
                <button className="overlay-action" type="button" onClick={hud.finished ? restart : togglePause}>
                  {hud.finished ? <><RotateCcw size={16} /> RESTART RACE</> : <><Play size={16} /> BACK TO THE HILL</>}
                </button>
              </div>
            </div>
          )}
          <div className="track-frame__tag"><span>●</span> LIVE TIMING</div>
          <div className="track-frame__altitude">ALT <strong>1,248</strong> FT</div>
        </div>

        <div className="race-footer">
          <div className="race-footer__note">
            <span className="note-mark">!</span><span>Fuel up on the trail. Keep your wheels down.</span>
            <button className="end-run-button" type="button" disabled={hud.finished} onClick={() => endRunRef.current?.('Run abandoned')}>
              <X size={14} /> END RUN
            </button>
          </div>
          <div className="controls">
            <span className="controls__hint">DRIVE</span>
            <ControlButton label="BRAKE" icon={ArrowDown} onDown={() => { controlsRef.current.brake = true; }} onUp={() => { controlsRef.current.brake = false; }} />
            <ControlButton label="JUMP" icon={ArrowUp} jump onDown={jumpCar} onUp={() => {}} />
            <ControlButton label="GAS" icon={ArrowUp} accent onDown={() => { controlsRef.current.throttle = true; }} onUp={() => { controlsRef.current.throttle = false; }} />
            <span className="keyboard-hint"><kbd>A</kbd><kbd>D</kbd> OR ARROWS</span>
          </div>
        </div>
      </section>

      <section className="run-board" aria-label="Run leaderboard">
        <div className="run-board__heading">
          <div>
            <p className="eyebrow">THE TIMING TENT</p>
            <h2>Run board<span>.</span></h2>
          </div>
          <span className={`api-status api-status--${apiStatus}`} aria-live="polite">
            <span />{apiStatus === 'online' ? 'SERVER ONLINE' : apiStatus === 'syncing' ? 'SAVING RUN' : apiStatus === 'connecting' ? 'CONNECTING' : 'SERVER OFFLINE'}
          </span>
        </div>
        <div className="run-board__columns" aria-hidden="true">
          <span>POS</span><span>DISTANCE</span><span>FINISH</span><span>DATE</span>
        </div>
        {leaderboard.length ? leaderboard.map((run, index) => (
          <div className="run-board__row" key={run.id}>
            <strong className="run-board__rank">{String(index + 1).padStart(2, '0')}</strong>
            <strong>{run.distance.toLocaleString()} <small>M</small></strong>
            <span>{run.reason} <small>· {run.coins} COINS</small></span>
            <time dateTime={run.completedAt}>{new Date(run.completedAt).toLocaleDateString()}</time>
          </div>
        )) : (
          <p className="run-board__empty">No runs recorded.</p>
        )}
      </section>

      <footer className="page-footer"><span>RIDGE RUNNER MOTOR CLUB</span><span>BUILT FOR THE LONG WAY UP</span></footer>
    </main>
  );
}
