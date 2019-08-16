namespace athena {
    export interface SubProgram {
        loop(): number
        stop(): void
    }

    export class Process {

        private _run: boolean
        private _kill: boolean

        constructor(subprogram: SubProgram) {
            this._run = true
            this._kill = false

            let default_pause_period: number = 20;
            let pause_period: number;

            control.inBackground(() => {

                while (this._kill == false) {

                    if (this._run) {
                        pause_period = subprogram.loop()
                        if (pause_period < 1) {
                            pause_period = default_pause_period;
                        }
                    }
                    basic.pause(pause_period)
                }

                if (this._kill) {
                    subprogram.stop()
                }
            })
        }

        run(running: boolean) {
            this._run = running;
            return this;
        }

        is_running() {
            return this._run;
        }

        kill() {
            this._kill = true;
        }
    }

    export interface BrainInterface {
        handleSingleNetworkCommand: (controller_id: string, command: any, value: number) => void
    }

    export class BrainClass {
        constructor() {

        }
    }

    interface DeviceInterface {

    }

    export interface DataProvideDeviceInterface extends DeviceInterface {
        getData: (key?: string) => any
    }

    export interface EventListeningDeviceInterface extends DeviceInterface {
        listenEvents: () => void
    }

    export class DeviceController {
        constructor() {

        }
    }

    export class SingleDeviceController extends DeviceController {
        constructor() {
            super()
        }
    }

    export class CompoundDeviceController extends DeviceController {
        constructor() {
            super()
        }
    }

    export class NetworkCommander {

        brain: BrainInterface

        constructor(brain: BrainInterface) {
            this.brain = brain
            this.setup()
        }

        private send(key: string, value: number) {
            radio.sendValue(key, value)
        }

        private setup() {
            radio.setGroup(13)
            radio.setTransmitPower(7)

            let brain = this.brain
            radio.onReceivedValue(function (name, value) {
                let command = name.split('.')
                let controller_id: string = command[0]
                let command_enum: any = command[1]
                brain.handleSingleNetworkCommand(controller_id, command_enum, value)
            })
        }

        public transmitSingleNetworkCommand(controller_id: string, command_id: any, value: number) {
            let command: string = controller_id + '.' + command_id
            this.send(command, value)
        }


    }
}


