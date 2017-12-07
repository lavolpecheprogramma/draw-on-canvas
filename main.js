(function() {
	var CreateOptions = function() {
	  this.distance = 5;
	  this.radius = 5;
	  this.free = false;
	};
	var options = new CreateOptions();
	

	var canvasElement = createCanvas(true);
	addEventListener();
	
	onResizeWindow();
	createGui();

	function createCanvas(append){
		var c = document.createElement('canvas');
		if(append){
			document.body.appendChild(c);
		}
		return {
			canvas: c,
			ctx: c.getContext("2d")
		}
	}

	function createGui(){
		var gui = new dat.GUI();
		gui.add(options, 'distance', 2, 250).step(1);
		gui.add(options, 'radius', 2, 50).step(1);
		gui.add(options, 'free');
	}

	function onResizeWindow(){
		setCanvasFillWindow();
	}

	function Point(ctx, radius, coords){
		this.ctx = ctx;
		this.coords = coords;
		this.radius = radius;
		this.amt = 0.4;
		this.state = {
			radius: 0.1
		};
		this.toDraw = false;
		this.toDestroy = false;
	};
	Point.prototype.update = function(toDestroy){
		if( toDestroy ){
			if(this.state.radius < this.amt){ this.toDestroy = true; return; }
			this.state.radius -= 0.01;
			this.toDraw = true;
		}else{
			if(this.state.radius >= this.radius){ return; }
			this.state.radius += this.amt;
			this.toDraw = true;
		}
	}

	Point.prototype.draw = function(){
		if(!this.toDraw){ return; }
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.arc(this.coords.x, this.coords.y, this.state.radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = 'white';
		this.ctx.fill();
		this.ctx.restore();
	}
	Point.prototype.resetCoords = function(coords){
		this.coords = coords;
	}
	Point.prototype.render = function(toDestroy){
		this.update(toDestroy);
		this.draw();
	}

	function Dragger(ctx, start, distance){
		this.ctx = ctx;
		this.freeMode = options.free;
		this.start = start;
		this.distancePoints = distance;
		this.points = [];
		this.points.push(new Point(this.ctx, 20, this.start));
		this.points.push(new Point(this.ctx, 10, this.start));
		this.interPoints = [];
		this.toDestroy = false;
		this.isFinished = false;
	};
	Dragger.prototype.update = function(point, isLast){
		var dX = point.x - this.start.x ;
		var dY = point.y - this.start.y ;
		var angle =  Math.atan2(dY, dX);

		var totDistance = Math.sqrt(dX*dX + dY*dY );

		if(this.freeMode){
			if(totDistance >= this.distancePoints){
				this.interPoints.push(new Point(this.ctx, options.radius, point));
				this.start = point;
			}
		}else{
			if(totDistance < this.distancePoints){
				this.interPoints = [];
			}else{
				var numpoints = parseInt(totDistance / this.distancePoints);

				var fullDistance = numpoints * this.distancePoints;
				var fullDistanceX = fullDistance * Math.cos(angle);
				var fullDistanceY = fullDistance * Math.sin(angle);
				
				if(numpoints > this.interPoints.length){
					var diff = numpoints - this.interPoints.length;
					for (var i = diff-1; i >= 0; i--) {
						this.interPoints.push(new Point(this.ctx, 5, { x: 0, y: 0}));
					}
				}else{
					this.interPoints.splice(numpoints - 1, this.interPoints.length - numpoints);
				}

				for (var i = 1; i <= numpoints; i++) {
					var distance = this.distancePoints * i;

					var x = this.start.x + distance * Math.cos(angle);
					var y = this.start.y + distance * Math.sin(angle);
					console.log('x',x, 'y',y);
					this.interPoints[i-1].resetCoords({ x: x, y: y });
				}
			}
		}

		this.points[0].resetCoords(point);

		if(isLast){
			this.toDestroy = true;
			this.points.splice(0,1);
		}
	}
	Dragger.prototype.render = function(point, isLast){
		// console.log('dragger render');
		for (var i = this.points.length - 1; i >= 0; i--) {
			this.points[i].render(this.toDestroy);
			if(this.points[i].toDestroy){
				this.points.splice(i,1);
			}
		}
		for (var i = this.interPoints.length - 1; i >= 0; i--) {
			this.interPoints[i].render(this.toDestroy);

			if(this.interPoints[i].toDestroy){
				this.interPoints.splice(i,1);
			}
		}
		if(!this.points.length && !this.interPoints.length ){
			this.isFinished = true;
		}
	}

	function onMouseDown(e) {
		if(!window.draggers){
			window.draggers = [];
		}

		window.draggers.push(
			new Dragger(
				canvasElement.ctx,
				{
					x : e.clientX || (e.touches && e.touches[0].clientX),
					y : e.clientY || (e.touches && e.touches[0].clientY)
				},
				options.distance
			)
		);
		window.dragging = window.draggers.length -1;
	};
	function onMouseMove(e) {
		if(window.dragging == undefined){ return; }

		window.draggers[window.dragging].update({
			x : e.clientX || (e.touches && e.touches[0].clientX),
			y : e.clientY || (e.touches && e.touches[0].clientY)
		});
	};

	function onMouseUp(e) {
		if(window.dragging == undefined){ return; }

		window.draggers[window.dragging].update({
			x : e.clientX || (e.touches && e.touches[0].clientX),
			y : e.clientY || (e.touches && e.touches[0].clientY)
		}, true);
		window.dragging = undefined;
	}

	function addEventListener(){
		window.addEventListener( 'resize', onResizeWindow , true);
		window.addEventListener( 'mousedown', onMouseDown);
		window.addEventListener( 'touchstart', onMouseDown);
		window.addEventListener( 'mousemove', onMouseMove);
		window.addEventListener( 'touchmove', onMouseMove);
		window.addEventListener( 'mouseup', onMouseUp);
		window.addEventListener( 'touchend', onMouseUp);
	}

	function setCanvasFillWindow(){
		canvasElement.canvas.width = window.innerWidth;
		canvasElement.canvas.height = window.innerHeight;
		canvasElement.ctx.width = window.innerWidth;
		canvasElement.ctx.height = window.innerHeight;
	}

	function animate(){
		setCanvasFillWindow();
		if(window.draggers && window.draggers.length){
			for (var i = window.draggers.length - 1; i >= 0; i--) {
				window.draggers[i].distancePoints = options.distance;
				window.draggers[i].distancePoints = options.distance;
				window.draggers[i].render();
				if(window.draggers[i].isFinished){
					window.draggers.splice(i,1);
					if(window.dragging != undefined){
						window.dragging -=1;
					}else{
						window.dragging = undefined;
					}
				}
			}
		}
		reqAnim = requestAnimationFrame(animate);
	}

	animate();

}());
