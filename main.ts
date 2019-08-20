//----------- Board Config -----------------------------
const MICROBIT_5V_NAME: string = 'tugov'
const MICROBIT_3V_NAME: string = 'vupet'


//----------- Pins Config 5V Board -----------------------------
const PIN_LEDEAR_R: AnalogPin = AnalogPin.P0
const PIN_LEDEAR_G: AnalogPin = AnalogPin.P1
const PIN_LEDEAR_B: AnalogPin = AnalogPin.P2

const PIN_LIGHT_SENSOR: AnalogPin = AnalogPin.P3

// const PIN_IR_MINI_RECEIVER: Pins = Pins.P7

const PIN_DHT11_SENSOR: DigitalPin = DigitalPin.P8

const PIN_MQ135_SENSOR: AnalogPin = AnalogPin.P10

const PIN_MP3DECODER_RX: SerialPin = SerialPin.P13
const PIN_MP3DECODER_TX: SerialPin = SerialPin.P14

const PIN_HCSR04_TRIGGER: DigitalPin = DigitalPin.P15
const PIN_HCSR04_ECHO: DigitalPin = DigitalPin.P16

//----------- Pins Config 3V Board -----------------------------
const PIN_LED3X3: DigitalPin = DigitalPin.P0
const PIN_TILT: DigitalPin = DigitalPin.P1

const PIN_FLAME_SENSOR: AnalogPin = AnalogPin.P2

const PIN_ESP8266_RX: SerialPin = SerialPin.P8
const PIN_ESP8266_TX: SerialPin = SerialPin.P12

const PIN_MOTION_FL: DigitalPin = DigitalPin.P13
const PIN_MOTION_FR: DigitalPin = DigitalPin.P14


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
    forwardX(speedLeft: number, speedRight: number) {
        this.busy = true
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, Math.constrain(speedLeft, 0, 255))
        motor.MotorRun(motor.Motors.M4, motor.Dir.CW, Math.constrain(speedRight, 0, 255))
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
const MOTION_FL = 'mfl'
const MOTION_FR = 'mfr'
const TILT_LAST_MSTIME = 'tilt_last_mstime'
const TILT = 'tilt'
const MP3DECODER = 'audio'

//Sensors Data Holder
let Data: any = {
    DISTANCE_FRONT: false,
    TEMPERATURE: false,
    HUMIDITY: false,
    LIGHT: false,
    FLAME: false,
    GAS: false,
    MOTION_FL: false,
    MOTION_FR: false,
    TILT_LAST_MSTIME: false,
    TILT: false,
    MP3DECODER: false
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

enum NEOPIXEL_MODE {
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
        radio.setTransmitPower(3)
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

        dfplayer.MP3_setSerial(PIN_MP3DECODER_RX, PIN_MP3DECODER_TX)
        dfplayer.setVolume(30)

        //Some Sensors Reading
        this.addOnEveryHook(5000, function () {
            thisObj.readSensors()
        })

        //Distance Reading
        this.addOnEveryHook(200, function () {
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

        //MP3Decoder
        this.addOnEveryHook(1000, function () {
            if (!Data[MP3DECODER]) {
                return
            }
            switch (Data[MP3DECODER]) {
                case 2001:
                    dfplayer.folderPlay(2, 1, dfplayer.yesOrNot.type1)
                    break
                case 3005:
                    dfplayer.folderPlay(3, 5, dfplayer.yesOrNot.type1)
                    break
                case 3013:
                    dfplayer.folderPlay(3, 13, dfplayer.yesOrNot.type1)
                    break
                // case 4003:
                //     dfplayer.folderPlay(4, 3, dfplayer.yesOrNot.type1)
                //     break
            }
            Data[MP3DECODER] = false
        })

        //IR Listener
        // cbit_IR.onPressEvent(RemoteButton.NUM0, function () {
        //     // thisObj.sendNetworkData(IR, 6)
        // })
        // cbit_IR.onPressEvent(RemoteButton.NUM1, function () {
        //     // thisObj.sendNetworkData(IR, 7)
        // })
        // cbit_IR.onPressEvent(RemoteButton.NUM2, function () {
        //     // thisObj.sendNetworkData(IR, 8)
        // })
        // cbit_IR.init(PIN_IR_MINI_RECEIVER)

        input.onButtonPressed(Button.B, function () {
            Data[MP3DECODER] = 2001
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
    neopixel_mode: NEOPIXEL_MODE

    wheels: Wheels
    neck: NeckServosController

    constructor() {
        super()

        let thisObj = this

        this.wheels_mode = WHEELS_MODE.NONE
        this.thingspeak_mode = THINGSPEAK_MODE.OFF
        this.neopixel_mode = NEOPIXEL_MODE.OFF

        let thingSpeak = new ThingSpeak()
        this.wheels = new Wheels()
        this.neck = new NeckServosController()

        motor.motorStopAll()

        let strip = neopixel.create(PIN_LED3X3, 9, NeoPixelMode.RGBW)

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
        let flame_reaction_threshold = 100
        this.addOnEveryHook(300, function () {
            Data[FLAME] = pins.analogReadPin(PIN_FLAME_SENSOR)
        })


        //Tilt Sensor
        const tilt_ms_threshold = 2500
        this.addOnEveryHook(10, function () {
            let t = input.runningTime()

            if (pins.digitalReadPin(PIN_TILT) == 0) {
                Data[TILT_LAST_MSTIME] = t
            }

            if (t - Data[TILT_LAST_MSTIME] < tilt_ms_threshold) {
                Data[TILT] = 1
            } else {
                Data[TILT] = 0
            }
        })

        let min_drive = 0

        //Motion Sensors Reading
        this.addOnEveryHook(1000, function () {
            if (Data[TILT] == 0) {//if the robot is shaking, this can't be a external motion
                Data[MOTION_FL] = pins.digitalReadPin(PIN_MOTION_FL)
                Data[MOTION_FR] = pins.digitalReadPin(PIN_MOTION_FR)
                if (Data[MOTION_FL] || Data[MOTION_FR]) {
                    min_drive = 1000
                }
            } else {
                Data[MOTION_FL] = 0
                Data[MOTION_FR] = 0
            }
        })

        //Wheels Control
        const wc_interval = 10
        let last_wheel_mode: WHEELS_MODE = WHEELS_MODE.NONE
        this.addOnEveryHook(wc_interval, function () {

            //Fire Response
            if (Data[FLAME] < flame_reaction_threshold && thisObj.wheels_mode != WHEELS_MODE.NONE) {
                thisObj.wheels.backward(255)
                thisObj.neck.front_top()
                return
            }

            //Reset Neck and Wheels and NeoPixel
            if (last_wheel_mode != WHEELS_MODE.NONE && thisObj.wheels_mode == WHEELS_MODE.NONE) {
                thisObj.neck.front()
                thisObj.wheels.stop()
                thisObj.neopixel_mode = NEOPIXEL_MODE.OFF
            }

            last_wheel_mode = thisObj.wheels_mode

            let df = Data[DISTANCE_FRONT]

            if (thisObj.wheels_mode == WHEELS_MODE.FREE_ROAM) {

                thisObj.neck.front()
                thisObj.neopixel_mode = NEOPIXEL_MODE.ON

                if (df == 0) {
                    thisObj.wheels.stop()
                } else if (df > 80) {
                    thisObj.wheels.forward(255)
                } else if (df > 20) {
                    thisObj.wheels.forward(200)
                } else if (df < 10) {
                    thisObj.wheels.backward(200)
                } else {
                    Math.randomRange(1, 10) < 9 ? thisObj.wheels.turnLeft(130) : thisObj.wheels.stop()
                }

            } else if (thisObj.wheels_mode == WHEELS_MODE.MOTION_FOLLOW) {

                thisObj.neopixel_mode = NEOPIXEL_MODE.ON

                if (df < 10 && df != 0) {
                    thisObj.wheels.stop()
                    thisObj.neck.front_top()
                } else if (Data[MOTION_FL] == 1 && Data[MOTION_FR] == 1 && min_drive > 0) {
                    thisObj.wheels.forward(255)
                    basic.pause(min_drive)
                    min_drive = 0
                } else if (Data[MOTION_FL] == 0 && Data[MOTION_FR] == 1 && min_drive > 0) {
                    thisObj.wheels.forwardX(255, 180)
                    basic.pause(min_drive)
                    min_drive = 0
                } else if (Data[MOTION_FL] == 1 && Data[MOTION_FR] == 0 && min_drive > 0) {
                    thisObj.wheels.forwardX(180, 255)
                    basic.pause(min_drive)
                    min_drive = 0
                } else {
                    thisObj.neck.front()
                    thisObj.wheels.stop()
                }

            } else {

            }

        })

        this.addOnEveryHook(10, function () {
            if (thisObj.neopixel_mode == NEOPIXEL_MODE.OFF) {
                strip.showColor(neopixel.colors(NeoPixelColors.Black))
            } else {
                strip.showRainbow(Math.randomRange(0, 366), Math.randomRange(0, 366))
            }
        })


        input.onButtonPressed(Button.A, function () {
            basic.showIcon(IconNames.Target, 1000)
            if (thisObj.wheels_mode == WHEELS_MODE.NONE) {
                thisObj.wheels_mode = WHEELS_MODE.FREE_ROAM
            } else if (thisObj.wheels_mode == WHEELS_MODE.FREE_ROAM) {
                thisObj.wheels_mode = WHEELS_MODE.MOTION_FOLLOW
            } else {
                thisObj.wheels_mode = WHEELS_MODE.NONE
            }
            basic.clearScreen()
        })


        input.onButtonPressed(Button.B, function () {
            thisObj.sendNetworkData(MP3DECODER, 2001)
            thisObj.neopixel_mode = (thisObj.neopixel_mode == NEOPIXEL_MODE.ON) ? NEOPIXEL_MODE.OFF : NEOPIXEL_MODE.ON
            basic.pause(2000)
            thisObj.shake_yes(4)
        })

        input.onButtonPressed(Button.AB, function () {
            if (thisObj.thingspeak_mode == THINGSPEAK_MODE.OFF) {
                thisObj.thingspeak_mode = THINGSPEAK_MODE.ON
            } else {
                thisObj.thingspeak_mode = THINGSPEAK_MODE.OFF
            }
        })

    }

    shake_yes(count: number) {
        this.neck.front()
        basic.pause(250)
        for (let index = 0; index < count; index++) {
            this.neck.bottom()
            basic.pause(500)
            this.neck.front_top()
            basic.pause(500)
        }
        this.neck.front()
    }

    shake_no(count: number) {
        for (let index = 0; index < count; index++) {
            this.wheels.turnLeft(255)
            basic.pause(300)
            this.wheels.turnRight(255)
            basic.pause(500)
            this.wheels.turnLeft(255)
            basic.pause(300)
            this.wheels.stop()
        }
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
