class SensorsReadingGroup1Controller extends athena.DeviceController implements athena.DataProvideDeviceInterface, athena.SubProgram {

    data: any
    process: athena.Process

    constructor() {
        super()
        this.data = {
            'temperature': null,
            'humidity': null
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

        return 5 * 1000
    }
    stop() { }
}


class SensorsReadingGroup2Controller extends athena.DeviceController implements athena.DataProvideDeviceInterface, athena.SubProgram {

    data: any
    process: athena.Process

    constructor() {
        super()
        this.data = {
            'light': null,
            'flame': null
        }
        this.process = new athena.Process(this)
    }

    getData(key: string) {
        return this.data[key]
    }

    loop() {
        //LDR Reading
        this.data['light'] = pins.analogReadPin(PIN_LIGHT_SENSOR)

        //Flame Reading
        this.data['flame'] = pins.analogReadPin(PIN_FLAME_SENSOR)

        return 300
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
        this.disable_data_sending = false

        this.process = new athena.Process(this)
    }

    update_env_data(field_index: number, value: number) {
        this.env_data[field_index] = value
    }

    sending_in_progress: boolean
    disable_data_sending: boolean

    sendData(channel: string, fields: any) {
        if (this.sending_in_progress == true) {
            return
        }
        if (this.disable_data_sending == true) {
            return
        }

        this.sending_in_progress = true
        basic.showIcon(IconNames.SmallHeart)
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
            basic.showIcon(IconNames.Ghost)
        } else {
            basic.showIcon(IconNames.Heart)
        }

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
        } else {
            basic.showIcon(IconNames.No)
        }

        this.sending_in_progress = false
    }

    loop() {
        this.sendData(THINGSPEAK_ENV_CHANNEL, this.env_data)
        return 1000 * 15;
    }

    stop() { }
}



// class DFPPlayerController extends athena.SingleDeviceController {

//     constructor() {
//         super()
//         // dfplayer.MP3_setSerial(PIN_DFPPlayer_RX, PIN_DFPPlayer_TX)
//         // dfplayer.setVolume(30)
//     }
// }


enum NeckFlipSegments {
    none, front, front_bottom, bottom, front_top
}
class NeckController {


    front() {
        motor.servo(motor.Servos.S8, 0)
    }
    front_top() {
        motor.servo(motor.Servos.S8, 20)
    }
    front_botom() {
        motor.servo(motor.Servos.S8, -20)
    }
    bottom() {
        motor.servo(motor.Servos.S8, -40)
    }
}


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










class IRReceiver extends athena.SingleDeviceController {
    constructor() {
        super()


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

    thingSpeak: ThingSpeak

    srg1c: SensorsReadingGroup1Controller
    srg2c: SensorsReadingGroup2Controller
    //dfppc: DFPPlayerController

    nc: NeckController

    wheelsController: WheelsController
    neckYawServo: NeckYawDevice

    networkCommander: athena.NetworkCommander
    process: athena.Process

    constructor() {
        super()

        this.srg1c = new SensorsReadingGroup1Controller()
        this.srg2c = new SensorsReadingGroup2Controller()
        //this.dfppc = new DFPPlayerController()
        this.nc = new NeckController()


        // this.wheelsController = new WheelsController()
        // this.neckYawServo = new NeckYawDevice()

        // this.networkCommander = new athena.NetworkCommander(this)

        this.thingSpeak = new ThingSpeak()

        this.nc.front()

        this.process = new athena.Process(this)
    }

    dance() {
        let t = 100
        this.nc.front_top()
        basic.pause(1500)
        this.nc.front_botom()

        basic.pause(800)
        this.nc.front_top()
        basic.pause(1500)
        this.nc.front_botom()

        basic.pause(800)
        this.nc.front()


    }

    handleSingleNetworkCommand(controller_id: string, command: any, value: number) {
        //serial.writeLine(controller_id + ' - ' + command + ' - ' + value)
    }

    loop() {

        let temperature = this.srg1c.getData('temperature')
        let humidity = this.srg1c.getData('humidity')
        let light = this.srg2c.getData('light')
        let flame = this.srg2c.getData('flame')

        this.thingSpeak.update_env_data(0, temperature)
        this.thingSpeak.update_env_data(1, humidity)
        this.thingSpeak.update_env_data(2, light)
        this.thingSpeak.update_env_data(3, flame)

        this.thingSpeak.disable_data_sending = true

        if (flame < 900) {
            this.nc.front_top()
        } else {
            this.nc.front()
        }

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
const PIN_FLAME_SENSOR: AnalogPin = AnalogPin.P2

const PIN_ESP8266_RX: SerialPin = SerialPin.P12
const PIN_ESP8266_TX: SerialPin = SerialPin.P13

const PIN_DFPPlayer_RX: SerialPin = SerialPin.P2
const PIN_DFPPlayer_TX: SerialPin = SerialPin.P8


//----------- Credentials -----------------------------
const WIFI_SSID = ''
const WIFI_PASSWORD = ''
const THINGSPEAK_ENV_CHANNEL = ''


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
    // basic.showString("B")
    // basic.pause(1000)
    // basic.clearScreen()

    brain = new BrainB()

} else {
    basic.showString('Configure Microbit Name')
}



input.onButtonPressed(Button.A, function () {
    (brain as BrainB).dance()
})
input.onButtonPressed(Button.B, function () {

})
input.onButtonPressed(Button.AB, function () {

})



