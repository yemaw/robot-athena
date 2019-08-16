class SensorsReadingGroupB1Controller extends athena.DeviceController implements athena.DataProvideDeviceInterface, athena.SubProgram {

    data: any
    process: athena.Process
    busy: boolean

    constructor() {
        super()
        this.data = {
            'temperature': null,
            'humidity': null,
            'light': null,
        }
        this.busy = false
        this.process = new athena.Process(this)
    }

    getData(key: string) {
        return this.data[key]
    }

    loop() {
        let t = 5 * 1000

        if (this.busy) {
            return t
        } else {
            this.busy = true
        }
        basic.showIcon(IconNames.SmallHeart)
        //DHT11 Querying (This block)
        dht11_dht22.queryData(
            DHTtype.DHT11,
            PIN_DHT11_SENSOR,
            true,
            false,
            true
        )
        basic.showIcon(IconNames.Heart)
        basic.pause(100)
        //Teamperature Reading
        this.data['temperature'] = Math.round(dht11_dht22.readData(dataType.temperature))
        basic.pause(100)
        //Humidity Reading
        this.data['humidity'] = Math.round(dht11_dht22.readData(dataType.humidity))
        basic.pause(100)
        //LDR Reading
        this.data['light'] = Math.round(pins.analogReadPin(PIN_LIGHT_SENSOR))
        basic.pause(100)

        this.busy = false
        return t
    }
    stop() { }
}

class SensorsReadingGroupB2Controller extends athena.DeviceController implements athena.DataProvideDeviceInterface, athena.SubProgram {

    data: any
    process: athena.Process
    busy: boolean

    constructor() {
        super()
        this.data = {
            'distance': null
        }
        this.busy = false
        this.process = new athena.Process(this)
    }

    getData(key: string) {
        return this.data[key]
    }

    loop() {
        let t = 200

        if (this.busy) {
            return t
        } else {
            this.busy = true
        }
        basic.showIcon(IconNames.SmallSquare)
        basic.pause(100)
        //Sonar Reading
        this.data['distance'] = sonar.ping(PIN_SONAR_TRIGGER, PIN_SONAR_ECHO, PingUnit.Centimeters)
        basic.showIcon(IconNames.Square)
        this.busy = false
        return t
    }
    stop() { }
}



class ThingSpeak implements athena.SubProgram {

    env_data: any
    busy: boolean
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

        this.busy = false

        //this.process = new athena.Process(this)
    }

    update_env_data(field_index: number, value: number) {
        this.env_data[field_index] = value
    }

    sendData(channel: string, fields: any) {

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
            basic.showIcon(IconNames.Ghost)
        } else {
            basic.showIcon(IconNames.Square)
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
    }

    loop() {
        let t = 1000 * 10

        if (this.busy == true) {
            return t
        } else {
            this.busy = true
        }

        this.sendData(THINGSPEAK_ENV_CHANNEL, this.env_data)

        this.busy = false
        return t;
    }

    stop() { }
}








class SensorsReadingGroup2Controller extends athena.DeviceController implements athena.DataProvideDeviceInterface, athena.SubProgram {

    data: any
    process: athena.Process
    busy: boolean

    constructor() {
        super()
        this.data = {
            'flame': null
        }
        this.busy = false
        this.process = new athena.Process(this)
    }

    getData(key: string) {
        return this.data[key]
    }

    loop() {
        let t = 100

        if (this.busy) {
            return t
        } else {
            this.busy = true
        }

        //Flame Reading
        this.data['flame'] = pins.analogReadPin(PIN_FLAME_SENSOR)

        this.busy = false
        return t
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


// class SonarSensor extends athena.SingleDeviceController implements athena.DataProvideDeviceInterface {
//     getData(key?: string) {
//         return sonar.ping(PIN_SONAR_TRIGGER, PIN_SONAR_ECHO, PingUnit.Centimeters)
//     }
// }






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

    thingSpeak: ThingSpeak

    // sonarSensor: SonarSensor
    // ledEarDevice: LEDEarsDevice
    // motionSensors: MotionSensors

    // networkCommander: athena.NetworkCommander
    process: athena.Process

    constructor() {
        super()

        this.thingSpeak = new ThingSpeak()

        // this.sonarSensor = new SonarSensor()
        // this.ledEarDevice = new LEDEarsDevice()
        // this.motionSensors = new MotionSensors()

        // this.networkCommander = new athena.NetworkCommander(this)
        this.process = new athena.Process(this)
    }

    handleSingleNetworkCommand(controller_id: string, command: any, value: number) {
        serial.writeLine(controller_id + ' - ' + command + ' - ' + value)
    }

    loop() {


        if (this.thingSpeak) {
            this.thingSpeak.update_env_data(0, 23)
            this.thingSpeak.update_env_data(1, 45)
            this.thingSpeak.update_env_data(2, 500)
        }


        // let distance = this.sonarSensor.getData()

        // if (distance > 10) {
        //     this.ledEarDevice.random()
        //     this.networkCommander.transmitSingleNetworkCommand(
        //         WheelsController.controller_id,
        //         WheelsControllerCommands.front, 0)
        // } else {
        //     this.ledEarDevice.red()
        // }

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

    srgb1c: SensorsReadingGroupB1Controller
    srgb2c: SensorsReadingGroupB2Controller

    //dfppc: DFPPlayerController
    nc: NeckController
    wc: WheelsController
    neckYawServo: NeckYawDevice

    networkCommander: athena.NetworkCommander
    process: athena.Process

    constructor() {
        super()

        this.srgb1c = new SensorsReadingGroupB1Controller()
        this.srgb2c = new SensorsReadingGroupB2Controller()


        // //this.dfppc = new DFPPlayerController()
        // this.nc = new NeckController()
        // this.wc = new WheelsController()
        // // this.neckYawServo = new NeckYawDevice()

        // // this.networkCommander = new athena.NetworkCommander(this)



        // this.nc.front()

        this.process = new athena.Process(this)
    }

    handleSingleNetworkCommand(controller_id: string, command: any, value: number) {
        //serial.writeLine(controller_id + ' - ' + command + ' - ' + value)
    }

    loop() {

        let temperature = this.srgb1c.getData('temperature')
        let humidity = this.srgb1c.getData('humidity')
        let light = this.srgb1c.getData('light')

        let distance = this.srgb2c.getData('distance')

        basic.showNumber(distance)


        // if (flame < 800) {
        //     this.nc.front_top()
        //     this.wc.backward()
        // } else {
        //     this.nc.front()
        //     this.wc.stopAll()
        // }

        return 100;
    }

    stop() { }

    acceptData(key: string, value: string) {

    }
}

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


class DataTransfer {
    count: number
    constructor(handler: (name: string, value: number) => void) {
        this.count = 0
        radio.setGroup(13)

        radio.onReceivedValue(function (name: string, value: number) {
            this.count += 1
            //handler(name, value)
        })
    }

    broadcast(key: string, value: number) {
        radio.sendValue(key, value)
    }

}

//----------- Board Config -----------------------------
const MICROBIT_A_NAME: string = 'vupet'
const MICROBIT_B_NAME: string = 'tugov'


//----------- Pins Config Board A -----------------------------
const PIN_ESP8266_RX: SerialPin = SerialPin.P8
const PIN_ESP8266_TX: SerialPin = SerialPin.P12



const PIN_MOTION_FRONT_LEFT: DigitalPin = DigitalPin.P0
const PIN_MOTION_FRONT_RIGHT: DigitalPin = DigitalPin.P1

const PIN_FLAME_SENSOR: AnalogPin = AnalogPin.P2

//----------- Pins Config Board B -----------------------------
const PIN_LEDEAR_R: AnalogPin = AnalogPin.P0
const PIN_LEDEAR_G: AnalogPin = AnalogPin.P1
const PIN_LEDEAR_B: AnalogPin = AnalogPin.P2

const PIN_LIGHT_SENSOR: AnalogPin = AnalogPin.P3

const PIN_IR_MINI_RECEIVER: Pins = Pins.P7

const PIN_DHT11_SENSOR: DigitalPin = DigitalPin.P8

const PIN_SONAR_TRIGGER: DigitalPin = DigitalPin.P15
const PIN_SONAR_ECHO: DigitalPin = DigitalPin.P16




const PIN_DFPPlayer_RX: SerialPin = SerialPin.P2
const PIN_DFPPlayer_TX: SerialPin = SerialPin.P2


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


    let dt: DataTransfer = new DataTransfer((name: string, value: number) => {

        let data = name.split('.')
        if (data[0]) {
            let group: string = data[0]
            let key: string = data[1]

            ts.update_env_data(0, value)
        }
    })

    input.onButtonPressed(Button.A, function () {
        basic.showNumber(dt.count)
    })

    let every_t_15000 = 0
    function every_15000() {
        ts.loop()
    }

    let ts: ThingSpeak = new ThingSpeak()

    basic.forever(function () {
        let rt = input.runningTime()

        if (rt - every_t_15000 > 5000 || every_t_15000 == 0) {
            every_15000()
            every_t_15000 = input.runningTime()
        }
    })

    //brain = new BrainA()
} else if (control.deviceName() == MICROBIT_B_NAME) {
    basic.showString("B")
    basic.pause(1000)
    basic.clearScreen()


    //brain = new BrainB()
    let data: any = {
        'distance': null,
        'temperature': null,
        'humidity': null,
        'light': null
    }

    let every_t_5000 = 0
    let every_t_2000 = 0
    let every_t_1000 = 0
    let every_t_500 = 0
    let every_t_100 = 0

    function every_5000() {

        //DHT11 Query (blocking)
        dht11_dht22.queryData(
            DHTtype.DHT11,
            PIN_DHT11_SENSOR,
            true,
            false,
            true
        )

        //Teamperature Reading
        data['temperature'] = Math.round(dht11_dht22.readData(dataType.temperature))
        //dt.broadcast("data.temperature", data['temperature'])

        //Humidity Reading
        data['humidity'] = Math.round(dht11_dht22.readData(dataType.humidity))
        //dt.broadcast("data.humidity", data['temperature'])
    }

    function every_2000() {

    }

    function every_1000() {
        //Light Reading
        data['light'] = Math.round(pins.analogReadPin(PIN_LIGHT_SENSOR))
        //dt.broadcast("data.light", data['light'])
    }

    function every_500() {

    }

    function every_100() {
        //Sonar Reading
        data['distance'] = sonar.ping(PIN_SONAR_TRIGGER, PIN_SONAR_ECHO, PingUnit.Centimeters)
        //dt.broadcast("data.distance", data['distance'])

        if (data['distance'] <= 10) {
            ledEars.red()
        } else if (data['light'] > 800) {
            ledEars.show_color(255, 255, 255)
        } else {
            ledEars.random()
        }
    }

    let ledEars: LEDEarsDevice = new LEDEarsDevice()
    let dt: DataTransfer = new DataTransfer((name: string, value: number) => {

    })


    basic.forever(function () {
        let rt = input.runningTime()

        if (rt - every_t_5000 > 5000 || every_t_5000 == 0) {
            every_5000()
            every_t_5000 = input.runningTime()
        }

        if (rt - every_t_2000 > 2000 || every_t_2000 == 0) {
            every_2000()
            every_t_2000 = input.runningTime()
        }

        if (rt - every_t_1000 > 1000 || every_t_1000 == 0) {
            every_1000()
            every_t_1000 = input.runningTime()
        }

        if (rt - every_t_500 > 500 || every_t_500 == 0) {
            every_500()
            every_t_500 = input.runningTime()
        }

        if (rt - every_t_100 > 100 || every_t_100 == 0) {
            every_100()
            every_t_100 = input.runningTime()
        }

        //basic.showNumber(data['distance'])
    })

    //IR
    cbit_IR.init(PIN_IR_MINI_RECEIVER)
    cbit_IR.onPressEvent(RemoteButton.NUM0, function () {
        basic.showIcon(IconNames.Heart)
    })


} else {
    basic.showString('Configure Microbit Name')
}



