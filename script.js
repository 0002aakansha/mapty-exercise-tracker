const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')
const reset__btn = document.querySelector('#reset--btn')

class Workout {
    date = new Date()
    id = (Date.now() + '')

    constructor(coords, distance, duration) {
        this.coords = coords
        this.distance = distance
        this.duration = duration
    }
    _setDescription() {
        const Month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${Month[this.date.getMonth()]} ${this.date.getDate()}`
    }
}

class Running extends Workout {
    type = 'running'
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence
        this.calcPac()
        this._setDescription()
    }
    // calc pace
    calcPac() {
        //min/km
        this.pace = this.duration / this.distance
        return this.pace
    }
}
class Cycling extends Workout {
    type = 'cycling'
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration)
        this.elevation = elevation
        this.calcEle()
        this._setDescription()
    }
    calcEle() {
        // km/h
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

const r1 = new Running([39, -12], 5.2, 24, 178)
const c1 = new Cycling([39, -12], 27, 95, 523)

class App {
    #map
    #mapEvent
    #workouts = []
    #zoomLevel = 17
    constructor() {
        this._getPosition()
        this._getLocalStorageItem()
        form.addEventListener('submit', this._newWorkout.bind(this))
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
        inputType.addEventListener('change', this._toggleElevationField)
        reset__btn.addEventListener('click', this.reset.bind(this))
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
                alert('Failed to get your position!')
            })
        }
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    _loadMap(position) {
        const { longitude, latitude } = position.coords
        const coords = [latitude, longitude]
        this.#map = L.map('map').setView(coords, this.#zoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this))
        this.#workouts.forEach(val => this._renderMarkup(val))
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove('hidden')
        inputDistance.focus()
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    _hideForm() {
        // clear input fields
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = ''
        form.classList.add('hidden')
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input))
        const allPositives = (...inputs) => inputs.every(input => input > 0)

        e.preventDefault()

        // get input values
        const typeVal = inputType.value
        const distanceVal = Number(inputDistance.value)
        const durationVal = Number(inputDuration.value)
        const { lat, lng } = this.#mapEvent.latlng
        let workout

        // If type is running
        if (typeVal === 'running') {
            // Check if data is valid
            const cadenceVal = Number(inputCadence.value)
            if (!validInputs(distanceVal, durationVal, cadenceVal)) return alert('Please insert valid values')
            if (!allPositives(distanceVal, durationVal, cadenceVal)) return alert('Please insert positive values')

            workout = new Running([lat, lng], distanceVal, durationVal, cadenceVal)
        }

        if (typeVal === 'cycling') {
            // if type is cycling
            const elevationVal = Number(inputElevation.value)

            if (!validInputs(distanceVal, durationVal, elevationVal)) return alert('Please insert valid values')
            if (!allPositives(distanceVal, durationVal)) return alert('Please insert positive values')

            workout = new Cycling([lat, lng], distanceVal, durationVal, elevationVal)
        }
        this.#workouts.push(workout)

        // Render workout marker
        this._renderMarkup(workout)
        this._renderWorkouts(workout)
        this._hideForm()
        this._setLocalStorage()
    }

    _renderMarkup(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️ ' : '🚴‍♀️ '} ${workout.description}`)
            .openPopup();
    }
    _renderWorkouts(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id=${workout.id}>
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️ ' : '🚴‍♀️ '}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>
        `

        if (workout.type === 'running') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `
        }
        if (workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevation}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li> 
            `
        }
        form.insertAdjacentHTML('afterend', html)
    }
    _moveToPopup(event) {
        const workoutEl = event.target.closest('.workout')

        if (!workoutEl) return
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)

        this.#map.setView(workout.coords, this.#zoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        })
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }
    _getLocalStorageItem() {
        const data = JSON.parse(localStorage.getItem('workouts'))

        if (!data) return
        this.#workouts = data
        this.#workouts.forEach(val => {
            this._renderWorkouts(val)
        })
    }
    reset() {
        const confirmBox = confirm('Are you sure...')
        if (confirmBox) {
            localStorage.removeItem('workouts')
            location.reload()
        }
    }
}

const app = new App()