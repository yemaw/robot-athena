class SonarDevice extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface {
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
    front, back, left, right, front_left, front_right, back_left, back_right
}

class MotionDevices extends athena.CompoundDeviceController implements athena.EventListeningDeviceInterface, athena.DataProvideDeviceInterface {

    constructor() {
        super()
    }

    listenEvents() {
        pins.onPulsed(PIN_MOTION_FRONT_LEFT, PulseValue.High, function () {

        })
        pins.onPulsed(PIN_MOTION_FRONT_RIGHT, PulseValue.Low, function () {

        })
    }

    getData(key?: string) {
        let fl: number = pins.digitalReadPin(PIN_MOTION_FRONT_LEFT)
        let fr: number = pins.digitalReadPin(PIN_MOTION_FRONT_RIGHT)

        if (fl == 1 && fr == 1) {
            return YawSegment.front
        } else if (fl == 1 && fr == 0) {
            return YawSegment.front_left;
        } else if (fl == 0 && fr == 1) {
            return YawSegment.front_right;
        } else {
            return null;
        }
    }
}



class NeckYawServo extends athena.SingleDeviceController {
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



class WheelDevices extends athena.CompoundDeviceController {
    basicForward() {
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, 255)
        motor.MotorRun(motor.Motors.M4, motor.Dir.CW, 255)
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



class TemperatureSensor extends athena.SingleDeviceController {
    constructor() {
        super()
    }
    execute() {
        let v = pins.analogReadPin(AnalogPin.P1)
        let temperature = Math.round(v * (3 / 10.24))

        return temperature
    }


}



class AmbientLightSensor extends athena.SingleDeviceController {
    constructor() {
        super()
    }
    execute() {
        let v = pins.analogReadPin(AnalogPin.P0)
        return v //todo::
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
            'temperature': null,
            'ambient_light': null,
            'humidity': null
        }
        this.wifiConnect()
    }

    wifiConnect() {
        if (!ESP8266ThingSpeak.isWifiConnected()) {
            ESP8266ThingSpeak.connectWifi(SerialPin.P2, SerialPin.P8, BaudRate.BaudRate115200, WIFI_SSID, WIFI_PASSWORD)
        }
    }

    update(key: string, value: number) {
        this.data[key] = value
    }

    sendData() {
        //basic.showIcon(IconNames.Square)
        ESP8266ThingSpeak.connectThingSpeak(
            "api.thingspeak.com",
            THINGSPEAK_DEFAULT_CHANNEL,
            this.data['temperature'],
            this.data['ambient_light'],
            this.data['humidity'],
            null,
            null,
            null,
            null,
            null
        )
        if (!ESP8266ThingSpeak.isLastUploadSuccessful()) {
            //basic.showIcon(IconNames.No)
        } else {
            //basic.showIcon(IconNames.Yes)
        }
    }

    loop() {
        this.sendData()
        return 1000 * 15;
    }

    stop() { }
}



class MasterBrain extends athena.BrainClass implements athena.BrainInterface, athena.SubProgram {

    sonarDevice: SonarDevice
    ledEarDevice: LEDEarsDevice
    motionDevices: MotionDevices

    constructor() {
        super()
        this.sonarDevice = new SonarDevice()
        this.ledEarDevice = new LEDEarsDevice()
        this.motionDevices = new MotionDevices()
    }

    setupCommunication(){
        radio.setGroup(ATHENA_RADIO_GROUP)
        radio.setTransmitPower(7)
        radio.onReceivedValue(function (name, value) {

        })
        //radio.sendValue("name", 0)
    }

    
    loop() {
        
        // if (this.sonarDevice.getData() > 10) {
        //     this.ledEarDevice.random()
        // } else {
        //     this.ledEarDevice.red()
        // }

        // let motion: YawSegment = this.motionDevices.getData()
        // if (motion == YawSegment.front) {
        //     this.ledEarDevice.red()
        // } else if (motion == YawSegment.front_left) {
        //     this.ledEarDevice.green()
        // } else if (motion == YawSegment.front_right) {
        //     this.ledEarDevice.blue()
        // } else if (motion == null) {
        //     this.ledEarDevice.random()
        // } else {
        //     basic.showIcon(IconNames.No)
        // }
        

        return 100;
    }

    stop() { }
}



class SlaveBrain extends athena.BrainClass implements athena.BrainInterface, athena.SubProgram {

    wheelDevices: WheelDevices

    constructor() {
        super()
        this.wheelDevices = new WheelDevices()
    }

    loop() {

        return 100;
    }

    stop() { }
}

//----------- Board Config -----------------------------
const ATHENA_RADIO_GROUP:number = 13
const MICROBIT_A_NAME:string = 'vupet'
const MICROBIT_B_NAME:string = 'tugov'


//----------- Pins Config -----------------------------
const PIN_SONAR_TRIGGER: DigitalPin = DigitalPin.P15
const PIN_SONAR_ECHO: DigitalPin = DigitalPin.P16

const PIN_LEDEAR_R: AnalogPin = AnalogPin.P12
const PIN_LEDEAR_G: AnalogPin = AnalogPin.P13
const PIN_LEDEAR_B: AnalogPin = AnalogPin.P14

const PIN_MOTION_FRONT_LEFT: DigitalPin = DigitalPin.P6
const PIN_MOTION_FRONT_RIGHT: DigitalPin = DigitalPin.P7


//----------- Credentials -----------------------------
const WIFI_SSID = ''
const WIFI_PASSWORD = ''
const THINGSPEAK_DEFAULT_CHANNEL = ''


//----------- Common Init -----------------------------
serial.redirectToUSB()


let brain, brainProcess
//----------- Spacific Init -----------------------------
if (control.deviceName() == MICROBIT_A_NAME) {

    brain = new MasterBrain()
    brainProcess = new athena.Process(brain)
} else if (control.deviceName() == MICROBIT_B_NAME) {

    brain = new MasterBrain()
    brainProcess = new athena.Process(brain)
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

