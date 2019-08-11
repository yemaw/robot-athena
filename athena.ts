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

    }

    export class BrainClass {
        constructor() { }
    }

    export interface DeviceInterface {

    }

    export class DeviceController{
        constructor(){
            
        }
    }

    export class SingleDeviceController extends DeviceController{
        constructor() {
            super()
        }
    }

    export class CompoundDeviceController extends DeviceController{
        constructor() {
            super()
         }
    }
}


