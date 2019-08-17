//----------- Board Config -----------------------------
const MICROBIT_5V_NAME: string = 'tugov'
const MICROBIT_3V_NAME: string = 'vupet'


//----------- Pins Config 5V Board -----------------------------
const PIN_LEDEAR_R: AnalogPin = AnalogPin.P0
const PIN_LEDEAR_G: AnalogPin = AnalogPin.P1
const PIN_LEDEAR_B: AnalogPin = AnalogPin.P2

const PIN_LIGHT_SENSOR: AnalogPin = AnalogPin.P3

const PIN_DHT11_SENSOR: DigitalPin = DigitalPin.P8

const PIN_MQ135_SENSOR: AnalogPin = AnalogPin.P10

const PIN_HCSR04_TRIGGER: DigitalPin = DigitalPin.P15
const PIN_HCSR04_ECHO: DigitalPin = DigitalPin.P16

//const PIN_IR_MINI_RECEIVER: Pins = Pins.P7

//----------- Pins Config 3V Board -----------------------------
const PIN_ESP8266_RX: SerialPin = SerialPin.P8
const PIN_ESP8266_TX: SerialPin = SerialPin.P12

const PIN_FLAME_SENSOR: AnalogPin = AnalogPin.P2


//----------- Credentials -----------------------------
const WIFI_SSID = ''
const WIFI_PASSWORD = ''
const THINGSPEAK_ENV_CHANNEL = ''


//----------- Device Wrapper Classes -----------------------------
class LEDEarsDevice {
    constructor() {
        this.off()
    }
    show_color(r: number, g: number, b: number) {
        pins.analogWritePin(PIN_LEDEAR_R, Math.constrain(r, 0, 255))
        pins.analogWritePin(PIN_LEDEAR_G, Math.constrain(g, 0, 255))
        pins.analogWritePin(PIN_LEDEAR_B, Math.constrain(b, 0, 255))
    }
    off() {
        this.show_color(0, 0, 0)
    }
    random() {
        this.show_color(Math.randomRange(0, 255), Math.randomRange(0, 255), Math.randomRange(0, 255))
    }
    red() {
        this.show_color(255, 0, 0)
    }
    green() {
        this.show_color(0, 255, 0)
    }
    blue() {
        this.show_color(0, 0, 255)
    }
    check() {
        if (Data[DISTANCE_FRONT] === null) {
            this.off()
        } else if (Data[DISTANCE_FRONT] === 0) {
            this.red()
        } else if (Data[DISTANCE_FRONT] <= 10) {
            this.blue()
        } else {
            if (Data[LIGHT] > 600) {
                this.show_color(255, 255, 255)
            } else {
                this.green()
            }
        }
    }
}

class ThingSpeak {

    sendData(channel: string, fields: number[]) {

        basic.showIcon(IconNames.SmallSquare)
        if (!ESP8266ThingSpeak.isWifiConnected()) {
            ESP8266ThingSpeak.connectWifi(
                PIN_ESP8266_RX,
                PIN_ESP8266_TX,
                BaudRate.BaudRate115200,
                WIFI_SSID,
                WIFI_PASSWORD
            )
        }

        if (!ESP8266ThingSpeak.isWifiConnected()) {
            basic.showIcon(IconNames.No)
        } else {
            ESP8266ThingSpeak.connectThingSpeak(
                "api.thingspeak.com",
                THINGSPEAK_ENV_CHANNEL,
                fields[0],
                fields[1],
                fields[2],
                fields[3],
                fields[4],
                fields[5],
                fields[6],
                fields[7],
            )

            if (ESP8266ThingSpeak.isLastUploadSuccessful()) {
                basic.showIcon(IconNames.Yes)
                //basic.clearScreen()
            } else {
                basic.showIcon(IconNames.Ghost)
            }
        }
    }
}

class Wheels {

    busy: boolean
    constructor() {
        this.busy = false
    }
    forward(speed: number) {
        this.busy = true
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, Math.constrain(speed, 0, 255))
        motor.MotorRun(motor.Motors.M4, motor.Dir.CW, Math.constrain(speed, 0, 255))
    }
    turnLeft(speed: number) {
        this.busy = true
        // motor.motorStop(motor.Motors.M4)
        motor.MotorRun(motor.Motors.M1, motor.Dir.CCW, Math.constrain(speed, 0, 255))
        motor.MotorRun(motor.Motors.M4, motor.Dir.CW, Math.constrain(speed, 0, 255))
    }
    turnRight(speed: number) {
        this.busy = true
        // motor.motorStop(motor.Motors.M1)
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, Math.constrain(speed, 0, 255))
        motor.MotorRun(motor.Motors.M4, motor.Dir.CCW, Math.constrain(speed, 0, 255))
    }
    backward(speed: number) {
        this.busy = true
        motor.MotorRun(motor.Motors.M1, motor.Dir.CCW, Math.constrain(speed, 0, 255))
        motor.MotorRun(motor.Motors.M4, motor.Dir.CCW, Math.constrain(speed, 0, 255))
    }
    stop() {
        motor.motorStopAll()
        this.busy = false
    }
}

class NeckServosController {
    front() {
        motor.servo(motor.Servos.S1, 0)
    }
    front_top() {
        motor.servo(motor.Servos.S1, 20)
    }
    front_botom() {
        motor.servo(motor.Servos.S1, -20)
    }
    bottom() {
        motor.servo(motor.Servos.S1, -40)
    }
}

//----------- Global Data Variables and Communication Keys -----------------------------

//Communication Keys
const DISTANCE_FRONT = 'df'
const TEMPERATURE = 't'
const HUMIDITY = 'h'
const LIGHT = 'l'
const FLAME = 'f'
const GAS = 'g'

//Sensors Data Holder
let Data: any = {
    DISTANCE_FRONT: false,
    TEMPERATURE: false,
    HUMIDITY: false,
    LIGHT: false,
    FLAME: false,
    GAS: false
}

enum WHEELS_MODE {
    NONE,
    FREE_ROAM,
    MOTION_FOLLOW
}

enum THINGSPEAK_MODE {
    OFF,
    ON
}

//----------- Main Classes -----------------------------
class EveryCallbackType {
    every: number
    callback: () => void
    last_run: number
    constructor(every: number, callback: () => void) {
        this.every = every
        this.callback = callback
        this.last_run = null
    }
}

abstract class Controller {

    on_every_hooks: EveryCallbackType[]

    constructor() {
        this.on_every_hooks = []

        let thisObj = this

        basic.forever(function () {
            let rt = input.runningTime()

            thisObj.on_every_hooks.forEach(function (item: EveryCallbackType, index: number) {
                let rt = input.runningTime()

                if (rt - item.last_run > item.every || item.last_run == null) {
                    item.callback()
                    item.last_run = input.runningTime()
                }
            })
        })

        radio.setGroup(13)
        radio.onReceivedValue(function (key: string, value: number) {
            thisObj.receiveNetworkData(key, value)
        })
    }

    addOnEveryHook(every: number, callback: () => void) {
        this.on_every_hooks.push(new EveryCallbackType(every, callback))
    }

    sendNetworkData(key: string, value: number) {
        radio.sendValue(key, value)
    }

    receiveNetworkData(key: string, value: number) {
        Data[key] = value
    }
}


class MB5VController extends Controller {

    constructor() {
        super()

        let thisObj = this

        let ledEars = new LEDEarsDevice()

        //Some Sensors Reading
        this.addOnEveryHook(5000, function () {
            thisObj.readSensors()
        })

        //Distance Reading
        this.addOnEveryHook(100, function () {
            //Distance Reading
            Data[DISTANCE_FRONT] = sonar.ping(PIN_HCSR04_TRIGGER, PIN_HCSR04_ECHO, PingUnit.Centimeters)

            if (Data[DISTANCE_FRONT] <= 80) {
                thisObj.sendNetworkData(DISTANCE_FRONT, Data[DISTANCE_FRONT])
            }

            ledEars.check()
        })
        this.addOnEveryHook(1000, function () {
            thisObj.sendNetworkData(DISTANCE_FRONT, Data[DISTANCE_FRONT])
        })
    }

    readSensors() {
        //DHT11 Query
        dht11_dht22.queryData(DHTtype.DHT11, PIN_DHT11_SENSOR, true, false, true)

        //Teamperature Reading
        Data[TEMPERATURE] = Math.round(dht11_dht22.readData(dataType.temperature))

        //Humidity Reading
        Data[HUMIDITY] = Math.round(dht11_dht22.readData(dataType.humidity))

        //Light Reading
        Data[LIGHT] = Math.round(pins.analogReadPin(PIN_LIGHT_SENSOR))

        //Gas Reading
        Data[GAS] = Math.round(pins.analogReadPin(PIN_MQ135_SENSOR))

        this.sendNetworkData(TEMPERATURE, Data[TEMPERATURE])
        this.sendNetworkData(HUMIDITY, Data[HUMIDITY])
        this.sendNetworkData(LIGHT, Data[LIGHT])
        this.sendNetworkData(GAS, Data[GAS])
    }
}

class MB3VController extends Controller {

    wheels_mode: WHEELS_MODE
    thingspeak_mode: THINGSPEAK_MODE

    constructor() {
        super()

        let thisObj = this

        this.wheels_mode = WHEELS_MODE.NONE
        this.thingspeak_mode = THINGSPEAK_MODE.OFF

        let thingSpeak = new ThingSpeak()
        let wheels = new Wheels()
        let neck = new NeckServosController()

        motor.motorStopAll()

        // ThingSpeak
        this.addOnEveryHook(15000, function () {
            if (thisObj.thingspeak_mode == THINGSPEAK_MODE.ON) {
                thingSpeak.sendData(THINGSPEAK_ENV_CHANNEL, [
                    Data[TEMPERATURE],
                    Data[HUMIDITY],
                    Data[LIGHT],
                    Data[GAS],
                    Data[FLAME],
                    null,
                    null,
                    null
                ])
            }
        })


        //Flame Sensor Reading
        this.addOnEveryHook(100, function () {
            Data[FLAME] = pins.analogReadPin(PIN_FLAME_SENSOR)
            if (Data[FLAME] < 900) {
                thisObj.sendNetworkData(FLAME, Data[FLAME])
            }
        })
        this.addOnEveryHook(2000, function () {
            thisObj.sendNetworkData(FLAME, Data[FLAME])
        })


        this.addOnEveryHook(1000, function () {
            thisObj.sendNetworkData(GAS, Data[GAS])
        })

        //Wheels Control
        const w_interval = 10
        let distance_error = 0
        let wheels_pause_for = 0
        let turning = false
        this.addOnEveryHook(w_interval, function () {
            if (thisObj.wheels_mode == WHEELS_MODE.NONE) {
                wheels.stop()
            } else {

                if (Data[FLAME] < 900) {
                    wheels.backward(255)
                    neck.front_top()
                    return
                }

                let df = Data[DISTANCE_FRONT]

                neck.front()

                if (df == 0) {
                    wheels.stop()
                } else if (df > 80) {
                    wheels.forward(255)
                } else if (df > 50) {
                    wheels.forward(200)
                } else if (df > 20) {
                    wheels.forward(150)
                } else if (df < 10) {
                    wheels.backward(200)
                } else {
                    //motor.motorStopAll()
                    // if(!turning){
                    //     turning = true
                    //     let left_or_right = 1
                    //     if(left_or_right == 1){
                    //         wheels.turnLeft(150)
                    //     }
                    // }

                    Math.randomRange(1, 10) < 9 ? wheels.turnLeft(130) : wheels.stop()
                }
            }

            // distance_error = (df == 0) ? distance_error + w_interval : 0

            // basic.showNumber(Math.round(distance_error / 100))
        })


        input.onButtonPressed(Button.A, function () {
            if (thisObj.wheels_mode == WHEELS_MODE.NONE) {
                thisObj.wheels_mode = WHEELS_MODE.FREE_ROAM
            } else {
                thisObj.wheels_mode = WHEELS_MODE.NONE
            }
        })

        input.onButtonPressed(Button.B, function () {
            if (thisObj.thingspeak_mode == THINGSPEAK_MODE.OFF) {
                thisObj.thingspeak_mode = THINGSPEAK_MODE.ON
            } else {
                thisObj.thingspeak_mode = THINGSPEAK_MODE.OFF
            }
        })
    }

}

//----------- Spacific Init -----------------------------
if (MICROBIT_5V_NAME == control.deviceName()) {
    basic.showNumber(5, 500)
    basic.clearScreen()

    new MB5VController()

} else if (MICROBIT_3V_NAME == control.deviceName()) {
    basic.showNumber(3, 500)
    basic.clearScreen()

    new MB3VController()

} else {
    basic.showString('Configure Microbit Name')
}
