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



class TemperatureSensor extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface {
    getData(key?: string) {
        let v = pins.analogReadPin(PIN_TEMPERATURE)
        return Math.round(v * (3 / 10.24))
    }
}



class AmbientLightSensor extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface {
    getData(key?: string) {
        let v = pins.analogReadPin(PIN_AMBIENT)
        return v
    }
}

//---

class NeckYawDevice extends athena.SingleDeviceController {

    front() {
        motor.servo(motor.Servos.S8, 25)
    }
    front_right() {
        motor.servo(motor.Servos.S8, 0)
    }
    front_left() {
        motor.servo(motor.Servos.S8, 50)
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







class ThingSpeak implements athena.SubProgram {

    data: any

    constructor() {
        this.data = {
            0: null,
            1: null,
            2: null,
            3: null,
            4: null,
            5: null,
            6: null,
            7: null
        }
        this.wifiConnect()
    }

    wifiConnect() {
        if (!ESP8266ThingSpeak.isWifiConnected()) {
            ESP8266ThingSpeak.connectWifi(SerialPin.P2, SerialPin.P8, BaudRate.BaudRate115200, WIFI_SSID, WIFI_PASSWORD)
        }
    }

    update(field_index: number, value: number) {
        this.data[field_index] = value
    }

    sendData() {
        ESP8266ThingSpeak.connectThingSpeak(
            "api.thingspeak.com",
            THINGSPEAK_DEFAULT_CHANNEL,
            this.data[0],
            this.data[1],
            this.data[2],
            this.data[3],
            this.data[4],
            this.data[5],
            this.data[6],
            this.data[7]
        )
        if (!ESP8266ThingSpeak.isLastUploadSuccessful()) {
            //basic.showIcon(IconNames.No)
        } else {
            //basic.showIcon(IconNames.Yes)
        }
    }

    loop() {
        this.sendData()
        return 1000 * 30;
    }

    stop() { }
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

    wheelsController: WheelsController
    temperatueSensor: TemperatureSensor
    ambientSensor: AmbientLightSensor

    neckYawServo: NeckYawDevice

    thingSpeak: ThingSpeak
    thingSpeakProcess: athena.Process

    networkCommander: athena.NetworkCommander

    constructor() {
        super()
        this.wheelsController = new WheelsController()
        this.temperatueSensor = new TemperatureSensor()
        this.ambientSensor = new AmbientLightSensor()
        this.neckYawServo = new NeckYawDevice()

        this.thingSpeak = new ThingSpeak()
        this.thingSpeakProcess = new athena.Process(this.thingSpeak)

        this.networkCommander = new athena.NetworkCommander(this)
    }

    handleSingleNetworkCommand(controller_id: string, command: any, value: number) {
        serial.writeLine(controller_id + ' - ' + command + ' - ' + value)
    }

    loop() {
        let temperature = this.temperatueSensor.getData()
        let ambient_light = this.ambientSensor.getData()

        this.thingSpeak.update(0, temperature)
        this.thingSpeak.update(1, ambient_light)

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
const PIN_TEMPERATURE: AnalogPin = AnalogPin.P1
const PIN_AMBIENT: AnalogPin = AnalogPin.P0


//----------- Credentials -----------------------------
const WIFI_SSID = ''
const WIFI_PASSWORD = ''
const THINGSPEAK_DEFAULT_CHANNEL = ''


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
    brainProcess = new athena.Process(<athena.SubProgram>brain)

} else {
    basic.showString('Configure Microbit Name')
}




// let sonarDevice = new SonarDevice(SONAR_TRIGGER_PIN, SONAR_ECHO_PIN)
// let ledEars = new LEDEarsDevice()
// let motionSensor = new MotionController()

// let wheelDriver = new WheelDrivers()

// let neoleds = new NeoLed3x3()
// let mp3decoder = new MP3Decoder()
// let temperatureSensor = new TemperatureSensor()
// let ambientLightSensor = new AmbientLightSensor()

// let neckYawServo = new NeckYawServo()


// let thingSpeak = new ThingSpeak()
// let thingSpeakProcess = new athena.Process(thingSpeak)


// let brain = new PetBrain();
// let brainProcess = new athena.Process(brain)

