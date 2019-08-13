class Group1SensorsReadingController extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface, athena.SubProgram {

    data: any
    process: athena.Process

    constructor() {
        super()
        this.data = {
            'temperature': null,
            'humidity': null,
            'light': null
        }
        this.process = new athena.Process(this)
    }

    getData(key: string) {
        return this.data[key]
    }

    loop() {
        //DHT11 Reading
        dht11_dht22.queryData(
            DHTtype.DHT11,
            PIN_DHT11_SENSOR,
            true,
            false,
            true
        )
        this.data['temperature'] = Math.round(dht11_dht22.readData(dataType.temperature))
        this.data['humidity'] = Math.round(dht11_dht22.readData(dataType.humidity))

        //LDR Reading
        this.data['light'] = pins.analogReadPin(PIN_LIGHT_SENSOR)

        return 3 * 1000
    }
    stop() { }
}


class ThingSpeak implements athena.SubProgram {

    env_data: any
    process: athena.Process

    constructor() {
        this.env_data = {
            0: null,
            1: null,
            2: null,
            3: null,
            4: null,
            5: null,
            6: null,
            7: null
        }

        this.sending_in_progress = false

        this.process = new athena.Process(this)
    }

    update_env_data(field_index: number, value: number) {
        this.env_data[field_index] = value
    }

    sending_in_progress: boolean

    sendData(channel: string, fields: any) {
        if (this.sending_in_progress == true) {
            return
        }

        this.sending_in_progress = true
        basic.showIcon(IconNames.SmallHeart)
        if (!ESP8266ThingSpeak.isWifiConnected()) {
            ESP8266ThingSpeak.connectWifi(
                SerialPin.P12,
                SerialPin.P13,
                BaudRate.BaudRate115200,
                "Lei",
                "hello123"
            )
        }
        basic.showIcon(IconNames.Heart)
        basic.pause(1000)


        ESP8266ThingSpeak.connectThingSpeak(
            "api.thingspeak.com",
            "XKF9XUCMFVW1DSGZ",
            20,
            20,
            20,
            0,
            0,
            0,
            0,
            0
        )
        if (ESP8266ThingSpeak.isLastUploadSuccessful()) {
            basic.showIcon(IconNames.Yes)
        } else {
            basic.showIcon(IconNames.No)
        }
        basic.pause(3000)
        this.sending_in_progress = false
    }

    loop() {

        this.sendData(THINGSPEAK_ENV_CHANNEL, this.env_data)
        return 1000 * 15;
    }

    stop() { }
}




// class AmbientLightSensor extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface {
//     getData(key?: string) {
//         let v = pins.analogReadPin(PIN_LIGHT_SENSOR)
//         return v
//     }
// }



class SonarSensor extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface {
    getData(key?: string) {
        return sonar.ping(PIN_SONAR_TRIGGER, PIN_SONAR_ECHO, PingUnit.Centimeters)
    }
}



class LEDEarsDevice extends athena.SingleDeviceController {
    constructor() {
        super()
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


enum YawSegment {
    none, front, back, left, right, front_left, front_right, back_left, back_right
}

class MotionSensors extends athena.CompoundDeviceController implements athena.EventListeningDeviceInterface, athena.DataProvideDeviceInterface {

    constructor() {
        super()
    }

    listenEvents() {
        // pins.onPulsed(PIN_MOTION_FRONT_LEFT, PulseValue.High, function () {

        // })
        // pins.onPulsed(PIN_MOTION_FRONT_RIGHT, PulseValue.Low, function () {

        // })
    }

    getData(key?: string) {
        let fl: number = pins.digitalReadPin(PIN_MOTION_FRONT_LEFT)
        let fr: number = pins.digitalReadPin(PIN_MOTION_FRONT_RIGHT)

        if (fl == 1 && fr == 1) {
            return YawSegment.front
        } else if (fl == 1 && fr == 0) {
            return YawSegment.front_left
        } else if (fl == 0 && fr == 1) {
            return YawSegment.front_right
        } else {
            return YawSegment.none
        }
    }
}









//---

class NeckYawDevice extends athena.SingleDeviceController {

    front() {
        motor.servo(motor.Servos.S8, 25)
        motor.servo(motor.Servos.S6, 25)
    }
    front_right() {
        motor.servo(motor.Servos.S8, 0)
        motor.servo(motor.Servos.S6, 0)
    }
    front_left() {
        motor.servo(motor.Servos.S8, 50)
        motor.servo(motor.Servos.S6, 50)
    }
}


enum WheelsControllerCommands {
    front,
    front_left,
    front_right
}
class WheelsController extends athena.CompoundDeviceController implements athena.SubProgram {

    static controller_id: string = 'WheelsController'

    loop() {
        return 0
    }

    stop() { }

    forward() {
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, 255)
        motor.MotorRun(motor.Motors.M4, motor.Dir.CW, 255)
    }
    backward() {
        motor.MotorRun(motor.Motors.M1, motor.Dir.CCW, 255)
        motor.MotorRun(motor.Motors.M4, motor.Dir.CCW, 255)
    }

    stopAll() {
        motor.motorStopAll()
    }
}


//-------


class NeoLed3x3 extends athena.SingleDeviceController {
    strip: neopixel.Strip
    constructor() {
        super()
        this.strip = neopixel.create(DigitalPin.P6, 9, NeoPixelMode.RGB)
    }
    showSomething() {

    }
    off() {

    }

}




class MP3Decoder extends athena.SingleDeviceController {

    constructor() {
        super()
        dfplayer.MP3_setSerial(SerialPin.P12, SerialPin.P13)
        dfplayer.setVolume(48)
    }

    play(folder: number, file: number) {
        dfplayer.folderPlay(2, 1, dfplayer.yesOrNot.type1)
    }
}






class IRReceiver extends athena.SingleDeviceController {
    constructor() {
        super()

        cbit_IR.onPressEvent(RemoteButton.NUM0, function () {

        })
        cbit_IR.init(Pins.P10)
    }
}













class BrainA extends athena.BrainClass implements athena.BrainInterface, athena.SubProgram {

    sonarSensor: SonarSensor
    ledEarDevice: LEDEarsDevice
    motionSensors: MotionSensors

    networkCommander: athena.NetworkCommander

    constructor() {
        super()
        this.sonarSensor = new SonarSensor()
        this.ledEarDevice = new LEDEarsDevice()
        this.motionSensors = new MotionSensors()

        this.networkCommander = new athena.NetworkCommander(this)
    }

    handleSingleNetworkCommand(controller_id: string, command: any, value: number) {
        serial.writeLine(controller_id + ' - ' + command + ' - ' + value)
    }

    loop() {

        let distance = this.sonarSensor.getData()

        if (distance > 10) {
            this.ledEarDevice.random()
            this.networkCommander.transmitSingleNetworkCommand(
                WheelsController.controller_id,
                WheelsControllerCommands.front, 0)
        } else {
            this.ledEarDevice.red()
        }

        //let motion: YawSegment = this.motionSensors.getData()
        //radio.sendValue("neck_yaw_servo", motion)
        //this.ledEarDevice.random()
        // switch (true) {
        //     case motion == YawSegment.front:
        //         this.ledEarDevice.green()
        //         radio.sendValue("neckyawservo", 1)
        //         break;

        //     case motion == YawSegment.front_right:
        //         this.ledEarDevice.red()
        //         radio.sendValue("neckyawservo", 1)
        //         break;

        //     case motion == YawSegment.front_left:
        //         this.ledEarDevice.blue()
        //         radio.sendValue("neckyawservo", 1)
        //         break;

        //     default:
        //         this.ledEarDevice.random()
        //         serial.writeLine("neckyawservo", YawSegment.none)
        //         break;
        // }


        // let command = "request.temperature.default.ax13xr4".split('.')
        // let command1 = "response.temperature.default.ax13xr4".split('.')

        // "broadcast.temperature.default.ie4ze1z".split('.')

        // "command.motors.forward.ie4ze1z".split('.')

        // basic.showString(command[0])


        return 100;
    }

    stop() { }
}



class BrainB extends athena.BrainClass implements athena.BrainInterface, athena.SubProgram {

    g1src: Group1SensorsReadingController

    wheelsController: WheelsController
    neckYawServo: NeckYawDevice
    thingSpeak: ThingSpeak
    networkCommander: athena.NetworkCommander
    process: athena.Process

    constructor() {
        super()

        this.g1src = new Group1SensorsReadingController()
        // this.wheelsController = new WheelsController()
        // this.neckYawServo = new NeckYawDevice()

        this.thingSpeak = new ThingSpeak()

        // this.networkCommander = new athena.NetworkCommander(this)
        this.process = new athena.Process(this)
    }

    handleSingleNetworkCommand(controller_id: string, command: any, value: number) {
        serial.writeLine(controller_id + ' - ' + command + ' - ' + value)
    }

    loop() {

        // let temperature = this.g1src.getData('temperature')
        // let humidity = this.g1src.getData('humidity')
        // let light = this.g1src.getData('light')

        // serial.writeLine("l:" + light + ' h:' + humidity + ' t:' + temperature)

        // this.thingSpeak.update(0, temperature)
        // this.thingSpeak.update(1, humidity)
        // this.thingSpeak.update(2, light)

        return 100;
    }

    stop() { }

    acceptData(key: string, value: string) {

    }
}

//----------- Board Config -----------------------------
const MICROBIT_A_NAME: string = 'vupet'
const MICROBIT_B_NAME: string = 'tugov'


//----------- Pins Config Board A -----------------------------
const PIN_SONAR_TRIGGER: DigitalPin = DigitalPin.P15
const PIN_SONAR_ECHO: DigitalPin = DigitalPin.P16

const PIN_LEDEAR_R: AnalogPin = AnalogPin.P12
const PIN_LEDEAR_G: AnalogPin = AnalogPin.P13
const PIN_LEDEAR_B: AnalogPin = AnalogPin.P14

const PIN_MOTION_FRONT_LEFT: DigitalPin = DigitalPin.P0
const PIN_MOTION_FRONT_RIGHT: DigitalPin = DigitalPin.P1


//----------- Pins Config Board B -----------------------------
const PIN_DHT11_SENSOR: DigitalPin = DigitalPin.P0
const PIN_LIGHT_SENSOR: AnalogPin = AnalogPin.P1

const PIN_WIFI_RX: SerialPin = SerialPin.P12
const PIN_WIFI_TX: SerialPin = SerialPin.P13


//----------- Credentials -----------------------------
const WIFI_SSID = 'Lei'
const WIFI_PASSWORD = 'hello123'
const THINGSPEAK_ENV_CHANNEL = 'XKF9XUCMFVW1DSGZ'


//----------- Common Init -----------------------------
serial.redirectToUSB()

let brain: athena.BrainInterface | athena.SubProgram, brainProcess
//----------- Spacific Init -----------------------------
if (control.deviceName() == MICROBIT_A_NAME) {
    basic.showString("A")
    basic.pause(1000)
    basic.clearScreen()

    brain = new BrainA()
    brainProcess = new athena.Process(<athena.SubProgram>brain)
} else if (control.deviceName() == MICROBIT_B_NAME) {
    basic.showString("B")
    basic.pause(1000)
    basic.clearScreen()

    brain = new BrainB()

} else {
    basic.showString('Configure Microbit Name')
}





