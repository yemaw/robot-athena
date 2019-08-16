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


// const PIN_DFPPlayer_RX: SerialPin = SerialPin.P2
// const PIN_DFPPlayer_TX: SerialPin = SerialPin.P2

//----------- Pins Config 3V Board -----------------------------
const PIN_ESP8266_RX: SerialPin = SerialPin.P8
const PIN_ESP8266_TX: SerialPin = SerialPin.P12

// const PIN_MOTION_FRONT_LEFT: DigitalPin = DigitalPin.P0
// const PIN_MOTION_FRONT_RIGHT: DigitalPin = DigitalPin.P1

// const PIN_FLAME_SENSOR: AnalogPin = AnalogPin.P2


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



// interface Controller{
//     constructor(){
//         basic.forever(){
//             let rt = input.runningTime()
//         }
//     }
// }

// class MB5VController implements Controller{

// }

// class MB3VController implements Controller{
    
// }


//----------- Common Init -----------------------------
serial.redirectToUSB()


let data: any = {
    'distance': null,
    'temperature': null,
    'humidity': null,
    'light': null
}

//----------- Spacific Init -----------------------------
if (control.deviceName() == MICROBIT_5V_NAME) {
    basic.showString("5")
    basic.pause(1000)
    basic.clearScreen()


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


} else if (control.deviceName() == MICROBIT_3V_NAME) {
    basic.showString("3")
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
} else {
    basic.showString('Configure Microbit Name')
}



