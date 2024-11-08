// Hello person checking out my source code
// bear in mind I am a game developer, 
// not a web developer. Please enjoy your stay

var isPaused = false;
let wiggleSpeed = 0.1;

var darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
let backgroundColorLight = new Float32Array([21 / 255, 96 / 255, 100 / 255, 1]);
let foregroundColorLight = new Float32Array([251 / 7 / 255, 250 /7/ 255, 248 / 5 / 255, 1]);

let backgroundColorDark = new Float32Array([27 / 255, 29 / 255, 31 / 255, 1]);
let foregroundColorDark = new Float32Array([7 / 255, 9 / 255, 11 / 255, 1]);

let body = document.querySelector('body');

window.onload = function () {
	var canvas = document.getElementById('glCanvas');
	var gl = canvas.getContext('webgl2');

	if (!gl) {
		console.error('Unable to initialize WebGL 2.0. Your browser may not support it.');
		return;
	}

	// function setPause(value) {
	// 	isPaused = value;
	// 	if (!isPaused) {
	// 		requestAnimationFrame(render); // Resume rendering loop
	// 	}
	// 	previousRenderTime = performance.now();
	// }

	// window.addEventListener("focus", (event) => { 
	// 	setPause(false);
	// });

	// window.addEventListener("blur", (event) => {
	// 	setPause(true);
	// });

	// Vertex shader code
	var vertexShaderSource = `#version 300 es
        in vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

	// Fragment shader code
	var fragmentShaderSource = `#version 300 es
        precision mediump float;
        uniform float u_time;
        uniform vec4 u_resolution;
        uniform vec4 u_aspectRatio;
        uniform vec4 u_backgroundColor;
        uniform vec4 u_foregroundColor;
        out vec4 fragColor;

        float random (float x) {
            return fract(sin(x)*1e4);
        }
        float noise3D (vec3 p) {
            const vec3 step = vec3(110.0, 241.0, 171.0);

            vec3 i = floor(p);
            vec3 f = fract(p);

            // For performance, compute the base input to a
            // 1D random from the integer part of the
            // argument and the incremental change to the
            // 1D based on the 3D -> 1D wrapping
            float n = dot(i, step);

            vec3 u = f * f * (3.0 - 2.0 * f);
            return mix( mix(mix(random(n + dot(step, vec3(0,0,0))),
                                random(n + dot(step, vec3(1,0,0))),
                                u.x),
                            mix(random(n + dot(step, vec3(0,1,0))),
                                random(n + dot(step, vec3(1,1,0))),
                                u.x),
                        u.y),
                        mix(mix(random(n + dot(step, vec3(0,0,1))),
                                random(n + dot(step, vec3(1,0,1))),
                                u.x),
                            mix(random(n + dot(step, vec3(0,1,1))),
                                random(n + dot(step, vec3(1,1,1))),
                                u.x),
                        u.y),
                    u.z);
        }
        vec2 Rotate( vec2 co, float a)
        {
            float cs = cos(a);
            float ss = sin(a);
            co = vec2(
                cs * co.x - ss * co.y,
                ss * co.x + cs * co.y
            );
            return co;
        }
        void main() {
            vec2 uv = gl_FragCoord.xy * u_resolution.zw;
            float centerMask = length(uv - vec2(0.5,0.5)) * 2.0;

            const float gridScale = 10.0;
            vec2 gridSize = vec2(gridScale,gridScale);
            gridSize.x *= u_aspectRatio.x;
            // vec3 col = vec3(fract(uv * gridSize), 0);

            float stripeScale = 1.0;
            float stripeTimeOffset = u_time * 1.0;
            vec2 uvStripes = uv;
            uvStripes *= vec2(stripeScale, stripeScale);
            uvStripes += vec2(stripeTimeOffset, stripeTimeOffset);
            // uvStripes *= vec2(.0,9.0);
            uvStripes = Rotate(uvStripes, 0.6);

            // vec2 noiseUV = uv;
            // // noiseUV.x *= 10.0;
            // // noiseUV.y *= 10.0;
            // float noise = noise3D(vec3(uv * gridSize, u_time));
            // // noise = noise * 0.5;
            // vec3 col = vec3(noise,noise,noise);

            float warpNoise = noise3D(vec3(uv * 1.3, u_time + u_time * 0.0016235 * 3.333));
            float angle = 9.0;
            vec2 warpVector = vec2(-sin(angle),cos(angle));
            uvStripes += (1.5 + (u_time * 0.63785) + 5.0) * 1.0 * warpNoise * warpVector;

            float warpNoise2 = noise3D(vec3(uv * 2.733231, u_time + u_time * 0.0035546235 * 1.333));
            float angle2 = 1.0;
            vec2 warpVector2 = vec2(-sin(angle2),cos(angle2));
            uvStripes += (1.5 + (u_time * 0.253785) + 3.0) * 2.0 * warpNoise2 * warpVector2;

            float stripe = fract(uvStripes.y);
            stripe = abs(stripe);
            float stripes = abs(stripe - mix(0.5, 0.75, sin(u_time * 0.017492)));
            stripes = smoothstep(0.227, 0.275, stripes) +  stripes * 2.0 * stripes * 2.0 * 0.3;
            // vec3 col = vec3(stripes,stripes,stripes);
            vec3 col = mix(u_backgroundColor.xyz, u_foregroundColor.xyz, stripes);
            // vec3 col = vec3(uvStripes.y,uvStripes.y,uvStripes.y);

            col *= vec3(centerMask,centerMask,centerMask);

            fragColor = vec4(col, 1);
        }
    `;

	// Create shaders
	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	// Create program
	var program = createProgram(gl, vertexShader, fragmentShader);

	// Set up attributes and uniforms
	var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	var resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    var aspectRatioUniformLocation = gl.getUniformLocation(program, 'u_aspectRatio');
	var timeUniformLocation = gl.getUniformLocation(program, 'u_time');
	var backgroundColorUniformLocation = gl.getUniformLocation(program, 'u_backgroundColor');
	var foregroundColorUniformLocation = gl.getUniformLocation(program, 'u_foregroundColor');

	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	var positions = [
		-1.0, -1.0,
		1.0, -1.0,
		-1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		1.0, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	function createShader(gl, type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	function createProgram(gl, vertexShader, fragmentShader) {
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
			return null;
		}

		return program;
	}

	var previousRenderTime = performance.now();
	var elapsedTime = -Math.random() * 17000;
	let titleDiv = document.getElementById('first-section-title');
	var offset = 0;
	function render(currentTime) {

		// let rect = titleDiv.getBoundingClientRect();
		// console.log('title div is ' + rect.right)
		// canvas.setAttribute("style", "left:" + rect.right + "px");

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(program);

		var delta = 0;
		if (!isPaused) {
			delta = currentTime - previousRenderTime;
			elapsedTime += delta;
		}
		gl.uniform1f(timeUniformLocation, elapsedTime / 1000 * wiggleSpeed);
		// gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
		gl.uniform4f(resolutionUniformLocation, canvas.width, canvas.height, 1.0 / canvas.width, 1.0 / canvas.height);
        gl.uniform4f(aspectRatioUniformLocation, canvas.width / canvas.height,  canvas.height / canvas.width, 0.0, 0.0);

		gl.uniform4fv(foregroundColorUniformLocation,
			darkMode ? foregroundColorDark : foregroundColorLight);
		gl.uniform4fv(backgroundColorUniformLocation,
			darkMode ? backgroundColorDark : backgroundColorLight);

		gl.bindVertexArray(vao);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		previousRenderTime = currentTime;


		if (!isPaused) {
			requestAnimationFrame(render);
		}
	}

	function requestRender() {
		requestAnimationFrame(render);
	}

	requestRender();

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
		darkMode = event.matches;
		requestRender();
	});

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

	body.onresize = (event) => {
		requestRender();
	};
	// body.addEventListener("resize", (event) => {
	// 	requestRender();
	// });

	// var previousScroll = window.screenY;
	body.onscroll = (event) => {
		requestRender();
	};
};

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function () {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight) {
			this.innerHTML = "More...";
			content.style.maxHeight = null;
		} else {
			this.innerHTML = "Less...";
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
}

function updateImage(slider, el) {
	let clip = slider.value * 0.01 * el.offsetWidth;
	el.style.clip = "rect(0px, " + clip + "px, 100000px, 0px)";

	// slider.style.top = el.offsetHeight / 2 + "px";
}

document.querySelectorAll('.slider').forEach((slider) => {
	updateImage(slider, slider.nextElementSibling);
	slider.onresize
});


// body.addEventListener("resize", (event) => {
// 	document.querySelectorAll('.slider').forEach((slider) => {
// 		updateImage(slider, slider.nextElementSibling);
// 	})
// });

// const myObserver = new ResizeObserver(entries => {
// 	// this will get called whenever div dimension changes
// 	entries.forEach(entry => {
// 		console.log('width', entry.contentRect.width);
// 		console.log('height', entry.contentRect.height);
// 		updateImage(entry, entry.nextElementSibling);
// 	});
// });

// document.querySelectorAll('.slider').forEach((slider) => {
// 	// updateImage(slider, slider.nextElementSibling);
// 	myObserver.observe(slider);
// })

// // myObserver.disconnect();