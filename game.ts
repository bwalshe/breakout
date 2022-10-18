interface Settings {
    readonly ballRadius: number;
    readonly paddleHeight: number;
    readonly paddleWidth: number;
}

interface State {
    readonly x: number;
    readonly y: number;
    readonly dx: number;
    readonly dy: number;
    readonly paddleX: number;
    readonly rightPressed: boolean;
    readonly leftPressed: boolean;
    readonly gameOver: boolean;
}


interface StateUpdate {
    (currentState: NonNullable<State>): NonNullable<State>;
}


class Game {
    private readonly canvas: HTMLCanvasElement;
    private readonly settings: Settings;
    private readonly ctx: CanvasRenderingContext2D;

    private state: State;
    private eventQueue: StateUpdate[];
    private interval: ReturnType<typeof setInterval>;


    constructor(canvasName: string, settings: Settings) {
        this.canvas = <HTMLCanvasElement>document.getElementById(canvasName);
        this.ctx = this.canvas.getContext("2d")!;

        this.settings = settings;

        const { width, height } = this.canvas;
        this.state = {
            x: width / 2,
            y: height - 30,
            dx: 2,
            dy: -2,
            paddleX: (width - settings.paddleWidth) / 2,
            rightPressed: false,
            leftPressed: false,
            gameOver: false
        }

        this.eventQueue = [];

        document.addEventListener("keydown", e => this.keyDownHandler(e), false);
        document.addEventListener("keyup", e => this.keyUpHandler(e), false);
    }

    private keyDownHandler(e: KeyboardEvent) {
        const update: StateUpdate = (s) => {
            if (e.key == "Right" || e.key == "ArrowRight") {
                return { ...s, rightPressed: true };
            }
            else if (e.key == "Left" || e.key == "ArrowLeft") {
                return { ...s, leftPressed: true };
            }
            return s;
        }
        this.eventQueue.push(update);
    }

    private keyUpHandler(e: KeyboardEvent) {
        const update: StateUpdate = (s) => {
            if (e.key == "Right" || e.key == "ArrowRight") {
                return { ...s, rightPressed: false };
            }
            else if (e.key == "Left" || e.key == "ArrowLeft") {
                return { ...s, leftPressed: false };
            }
            return s
        }
        this.eventQueue.push(update);
    }

    private drawBall() {
        const { x, y } = this.state;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.settings.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#0095DD";
        this.ctx.fill();
        this.ctx.closePath();
    }

    private drawPaddle() {
        const { ctx } = this;
        const { paddleWidth, paddleHeight } = this.settings;
        const { height } = this.canvas;
        const { paddleX } = this.state;
        ctx.beginPath();
        ctx.rect(paddleX, height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    private checkCollision(s: State): State {
        const { x, dx, y, dy } = s;
        const { ballRadius } = this.settings;
        const { width } = this.canvas;

        const newDx = (x + dx > width - ballRadius || x + dx < ballRadius) ? -dx : dx;
        const newDy = (y + dy < ballRadius) ? -dy : dy;

        return { ...s, dx: newDx, dy: newDy }
    }

    private movePaddle(s: State): State {
        const { leftPressed, rightPressed } = s
        const { width } = this.canvas;
        const { paddleWidth } = this.settings;

        let { paddleX } = s;

        if (rightPressed && s.paddleX < width - paddleWidth) {
            paddleX += 7;
        }

        if (leftPressed && s.paddleX > 0) {
            paddleX -= 7;
        }

        return { ...s, paddleX: paddleX };
    }

    private moveBall(s: State): State {
        const { x, y, dx, dy } = s;
        return { ...s, x: x + dx, y: y + dy };
    }

    private checkOutOfCourt(s: State): State {
        const { x, y, dy, paddleX } = s;
        const { height } = this.canvas;
        const { ballRadius, paddleWidth } = this.settings;

        if (y + dy > height - ballRadius) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                return { ...s, dy: -dy };
            }
            return { ...s, gameOver: true };
        }
        return s;
    }

    private draw() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawBall();
        this.drawPaddle();

        if (this.state.gameOver) {
            return;
        }

        const stateUpdates = [
            this.checkCollision,
            this.checkOutOfCourt,
            this.movePaddle,
            this.moveBall
        ]

        this.state = this.eventQueue.concat(stateUpdates)
            .reduce((s, f) => f(s), this.state)
        this.eventQueue = []

        if (this.state.gameOver) {
            alert("GAME OVER");
            document.location.reload();
            clearInterval(this.interval);
        }
    }

    run() {
        this.interval = setInterval(() => this.draw(), 10);
    }
}

const game = new Game("myCanvas",
    {
        ballRadius: 10,
        paddleHeight: 10,
        paddleWidth: 75
    });

game.run();
