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
            connection.play(getRandomAudio(), { volume: 5 });
            play(connection)
        }, getRandomTime())
    }
}

function getRandomTime() {
    return Math.floor(Math.random() * 10) * 60000
}

function getRandomAudio() {
    let arquivo = Math.floor(Math.random()* 18) 
    return `./audios-fps/${arquivo}.mp3`
}

function stop(voice_channel) {
    this.stoped = true
    voice_channel.leave();
}