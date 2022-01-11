exports.fps = (voice_channel) => {
    return fps(voice_channel);
}

exports.stop = (voice_channel) => {
    return stop(voice_channel);
}

let stoped = true

async function fps(voice_channel) {
    const connection = await voice_channel.join();
    this.stoped = false
    play(connection)
}

function play(connection){
    if(!this.stoped){
        setTimeout(() => {
            console.log('entrou')
            connection.play(getRandomAudio(), { volume: 15 });
            play(connection)
        }, getRandomTime())
    }
}

function getRandomTime() {
    return Math.floor(Math.random() * 10) * 60000
}

function getRandomAudio() {
    let arquivo = Math.floor(Math.random()* 18) 
    let audio = `./audios-fps/${arquivo}.mp3`
    console.log(audio)
    return audio
}

function stop(voice_channel) {
    voice_channel.leave();
    this.stoped = true
}