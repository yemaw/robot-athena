class SonarSensor extends athena.DeviceClass implements athena.DeviceInterface {
    execute() {
        return sonar.ping(DigitalPin.P15, DigitalPin.P16, PingUnit.Centimeters)
    }
}



class LEDEars extends athena.DeviceClass implements athena.DeviceInterface {
    constructor() {
        super()
        this.show_color(0, 0, 0)
    }
    show_color(r: number, g: number, b: number) {
        pins.analogWritePin(AnalogPin.P12, Math.constrain(r, 0, 255))
        pins.analogWritePin(AnalogPin.P13, Math.constrain(g, 0, 255))
        pins.analogWritePin(AnalogPin.P14, Math.constrain(b, 0, 255))
    }
    off() {
        this.show_color(0, 0, 0)
    }
    random(min: number, max: number) {
        this.show_color(Math.randomRange(min, max), Math.randomRange(min, max), Math.randomRange(min, max))
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



class NeoLed3x3 extends athena.DeviceClass implements athena.DeviceInterface {
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



class MotionSensors extends athena.DeviceClass implements athena.DeviceInterface {
    execute() {
        let fl: number = pins.digitalReadPin(DigitalPin.P2)
        let fr: number = pins.digitalReadPin(DigitalPin.P8)

        if (fl == 1 && fr == 1) {
            return 90;
        } else if (fl == 1 && fr == 0) {
            return 45;
        } else if (fl == 0 && fr == 1) {
            return 135;
        } else {
            return -1;
        }
    }
}



class WheelDrivers extends athena.DeviceClass implements athena.DeviceInterface {
    basicForward() {
        motor.MotorRun(motor.Motors.M1, motor.Dir.CW, 255)
        motor.MotorRun(motor.Motors.M4, motor.Dir.CW, 255)
    }
    stopAll() {
        motor.motorStopAll()
    }
}



class MP3Decoder extends athena.DeviceClass implements athena.DeviceInterface {

    constructor() {
        super()
        dfplayer.MP3_setSerial(SerialPin.P12, SerialPin.P13)
        dfplayer.setVolume(48)
    }

    play(folder: number, file: number) {
        dfplayer.folderPlay(2, 1, dfplayer.yesOrNot.type1)
    }
}



class TemperatureSensor extends athena.DeviceClass implements athena.DeviceInterface {
    constructor() {
        super()
    }
    execute() {
        let v = pins.analogReadPin(AnalogPin.P1)
        let temperature = Math.round(v * (3 / 10.24))

        return temperature
    }


}



class AmbientLightSensor extends athena.DeviceClass implements athena.DeviceInterface {
    constructor() {
        super()
    }
    execute() {
        let v = pins.analogReadPin(AnalogPin.P0)
        return v //todo::
    }
}



class IRReceiver extends athena.DeviceClass implements athena.DeviceInterface {
    constructor() {
        super()

        cbit_IR.onPressEvent(RemoteButton.NUM0, function () {

        })
        cbit_IR.init(Pins.P10)
    }
}



class DataLogger implements athena.SubProgram {
    constructor() {
        this.connect()
    }

    connect() {
        ESP8266ThingSpeak.connectWifi(SerialPin.P2, SerialPin.P8, BaudRate.BaudRate115200, "<ssid>", "<password>")
    }

    count: 0
    temperature: any

    sendDataToThingSpeak() {

        if (ESP8266ThingSpeak.isWifiConnected()) {
            ESP8266ThingSpeak.connectThingSpeak(
                "api.thingspeak.com",
                "<thingspeak_writekey>",
                this.temperature,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            )
            basic.showIcon(IconNames.Heart)
        } else {
            basic.showIcon(IconNames.No)
        }

        this.count++
        serial.writeLine("count: " + this.count)
    }

    loop() {
        this.sendDataToThingSpeak()
        return 1000 * 15;
    }

    stop() { }

    update(key: string, value: any) {
        if (key == 'temperature') {
            this.temperature = value;
        }
    }
}



class PetBrain extends athena.BrainClass implements athena.BrainInterface, athena.SubProgram {
    constructor() {
        super()
    }

    loop() {

        //let distance = sonarSensor.execute()


        // let msL: number = pins.digitalReadPin(DigitalPin.P2)
        // let msR: number = pins.digitalReadPin(DigitalPin.P8)
        // serial.writeLine('L: ' + msL + ' R: ' + msR + ' D: ' + distance)
        //serial.writeLine('d : ' + distance)
        //ledEars.random(50, 255)

        if (Math.randomRange(0, 100) == 1) {
            //mp3decoder.play(2, 1)
        }

        //basic.showNumber(temperatureSensor.execute())
        //basic.showNumber(ambientLightSensor.execute())

        // if (distance == 0) {
        //     ledEars.show_color(0, 0, 255)
        //     motor.motorStopAll()
        // } else if (distance != 0 && distance <= 10) {
        //     ledEars.show_color(255, 0, 0)
        //     motor.motorStopAll()
        // } else if (distance > 10) {
        //     ledEars.show_color(Math.randomRange(0, 100), Math.randomRange(0, 100), Math.randomRange(0, 100))
        //     motor.MotorRun(motor.Motors.M1, motor.Dir.CW, 255)
        //     motor.MotorRun(motor.Motors.M4, motor.Dir.CW, 255)
        // }

        temperatureSensor.execute();

        return 3000;
    }

    stop() { }
}






let sonarSensor = new SonarSensor()
let motionSensor = new MotionSensors()

let wheelDriver = new WheelDrivers()
let ledEars = new LEDEars()
let neoleds = new NeoLed3x3()
let mp3decoder = new MP3Decoder()
let temperatureSensor = new TemperatureSensor()
let ambientLightSensor = new TemperatureSensor()

let dataLogger: athena.SubProgram
let dataLoggerProcess: athena.Process

let brain: athena.SubProgram;
let brainProcess: athena.Process;

brain = new PetBrain();
brainProcess = new athena.Process(brain)

dataLogger = new DataLogger()
dataLoggerProcess = new athena.Process(dataLogger)
