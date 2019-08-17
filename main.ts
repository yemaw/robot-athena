//----------- Board Config -----------------------------
const MICROBIT_5V_NAME: string = 'tugov'
const MICROBIT_3V_NAME: string = 'vupet'


//----------- Pins Config 5V Board -----------------------------
const PIN_LEDEAR_R: AnalogPin = AnalogPin.P0
const PIN_LEDEAR_G: AnalogPin = AnalogPin.P1
const PIN_LEDEAR_B: AnalogPin = AnalogPin.P2

const PIN_LIGHT_SENSOR: AnalogPin = AnalogPin.P3

const PIN_IR_MINI_RECEIVER: Pins = Pins.P7

const PIN_DHT11_SENSOR: DigitalPin = DigitalPin.P8

const PIN_SONAR_TRIGGER: DigitalPin = DigitalPin.P15
const PIN_SONAR_ECHO: DigitalPin = DigitalPin.P16


//----------- Pins Config 3V Board -----------------------------
const PIN_ESP8266_RX: SerialPin = SerialPin.P8
const PIN_ESP8266_TX: SerialPin = SerialPin.P12


//----------- Credentials -----------------------------
const WIFI_SSID = ''
const WIFI_PASSWORD = ''
const THINGSPEAK_ENV_CHANNEL = ''


//----------- Classes -----------------------------
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
}


class ThingSpeak {

    busy: boolean

    constructor() {
        this.busy = false
    }

    sendData(channel: string, fields: number[]) {

        this.busy = true

        // basic.showIcon(IconNames.SmallSquare)
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
                //basic.showIcon(IconNames.Yes)
                basic.clearScreen()
            } else {
                basic.showIcon(IconNames.Ghost)
            }
        }

        this.busy = false
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

//----------- Global Variables and Communication Keys -----------------------------
// let DATA_DISTANCE_FRONT: number = null
// let DATA_TEMPERATURE: number = null
// let DATA_HUMIDITY: number = null
// let DATA_LIGHT: number = null
// let DATA_FLAME: number = null
// let DATA_MOTION_LEFT: number = null
// let DATA_MOTION_RIGHT: number = null

const DISTANCE_FRONT = 'df'
const TEMPERATURE = 't'
const HUMIDITY = 'h'
const LIGHT = 'l'
const FLAME = 'f'

let Data: any = {
    DISTANCE_FRONT: false,
    TEMPERATURE: false,
    HUMIDITY: false,
    LIGHT: false,
    FLAME: false
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
    count: number
    constructor() {
        super()

        let thisObj = this

        let ledEars = new LEDEarsDevice()


        //60s
        this.addOnEveryHook(60000, function () {

        })


        //30s
        this.addOnEveryHook(30000, function () {

        })


        //15s
        this.addOnEveryHook(15000, function () {

        })


        //5s
        this.addOnEveryHook(5000, function () {
            //DHT11 Query
            dht11_dht22.queryData(
                DHTtype.DHT11,
                PIN_DHT11_SENSOR,
                true,
                false,
                true
            )

            //Teamperature Reading
            Data[TEMPERATURE] = Math.round(dht11_dht22.readData(dataType.temperature))

            //Humidity Reading
            Data[HUMIDITY] = Math.round(dht11_dht22.readData(dataType.humidity))

            //Light Reading
            Data[LIGHT] = Math.round(pins.analogReadPin(PIN_LIGHT_SENSOR))

            thisObj.sendNetworkData(TEMPERATURE, Data[TEMPERATURE])
            thisObj.sendNetworkData(HUMIDITY, Data[HUMIDITY])
            thisObj.sendNetworkData(LIGHT, Data[LIGHT])
        })


        //3s
        this.addOnEveryHook(3000, function () {

        })

        //1s
        this.addOnEveryHook(1000, function () {
            thisObj.sendNetworkData(DISTANCE_FRONT, Data[DISTANCE_FRONT])
        })


        //100ms
        this.addOnEveryHook(100, function () {
            //Distance Reading
            Data[DISTANCE_FRONT] = sonar.ping(PIN_SONAR_TRIGGER, PIN_SONAR_ECHO, PingUnit.Centimeters)

            if (Data[DISTANCE_FRONT] <= 50) {
                thisObj.sendNetworkData(DISTANCE_FRONT, Data[DISTANCE_FRONT])
            }

            if (Data[DISTANCE_FRONT] === null) {
                ledEars.off()
            } else if (Data[DISTANCE_FRONT] === 0) {
                ledEars.red()
            } else if (Data[DISTANCE_FRONT] <= 10) {
                ledEars.blue()
            } else {
                ledEars.green()
            }


        })


        //10ms
        this.addOnEveryHook(10, function () {

        })


    }


}

class MB3VController extends Controller {

    send_to_thingspeak: boolean

    constructor() {
        super()

        let thisObj = this

        this.send_to_thingspeak = false

        let thinkSpeak = new ThingSpeak()
        let wheels = new Wheels()

        motor.motorStopAll()

        // ThingSpeak
        this.addOnEveryHook(15000, function () {
            if (!thinkSpeak.busy && thisObj.send_to_thingspeak) {
                thinkSpeak.sendData(THINGSPEAK_ENV_CHANNEL, [
                    Data[TEMPERATURE],
                    Data[HUMIDITY],
                    Data[LIGHT],
                    Data[FLAME],
                    null,
                    null,
                    null,
                    null
                ])
            }
        })


        //5s
        this.addOnEveryHook(5000, function () {

        })


        //3s
        this.addOnEveryHook(3000, function () {

        })


        //1s
        this.addOnEveryHook(1000, function () {
            // let degrees = input.compassHeading();
            // basic.showNumber(degrees)
        })


        //500ms
        this.addOnEveryHook(500, function () {

        })


        //Wheels Control
        const w_interval = 10
        let distance_error = 0
        let wheels_pause_for = 0

        let turning = false
        this.addOnEveryHook(w_interval, function () {

            let df = Data[DISTANCE_FRONT]

            if (Data[FLAME] < 800) {
                wheels.backward(200)
            } else {
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


        //10ms
        this.addOnEveryHook(10, function () {

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




