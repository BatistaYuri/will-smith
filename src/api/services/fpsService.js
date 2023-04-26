exports.fps = (voice_channel) => {
    return fps(voice_channel);
}

exports.stop = (voice_channel) => {
    return stop(voice_channel);
}

let stoped = true

async function fps(voice_channel) {
    const connection = await voice_channel.join();
    stoped = false
    play(connection)
}

function play(connection){
    if(!stoped){
        setTimeout(() => {
            connection.play(getRandomAudio(), { volume: 1 });
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
    stoped = true
    voice_channel.leave();
}