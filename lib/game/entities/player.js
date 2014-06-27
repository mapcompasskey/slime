ig.module(
    'game.entities.player'
)
.requires(
    'impact.entity'
)
.defines(function() {
    EntityPlayer = ig.Entity.extend({
        
        size: {x: 8, y: 5},
        offset: {x: 4, y: 11},
        maxVel: {x: 100, y: 220},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 40,
        jump: 220,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/player.png', 16, 16 ),
        
        origin: {x: 0, y: 0},
        vertex: {x: 0, y: 0},
        target: {x: 0, y: 0},
        isInvincible: false,
        
        walking: false,
        jumping: false,
        falling: false,
        hurting: false,
        crouching: false,
        dying: false,
        
        type: ig.Entity.TYPE.A, // add to friendly group
        checkAgainst: ig.Entity.TYPE.NONE, // check collisions against nothing
        collides: ig.Entity.COLLIDES.PASSIVE,
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.4, [0, 2] );
            this.addAnim( 'crouch', 1, [3], true );
            this.addAnim( 'jump', 1, [4], true );
            this.addAnim( 'fall', 1, [5], true );
            this.addAnim( 'hurt', 1, [5], true );
            this.addAnim( 'dead', 0.2, [6, 7, 8], true );
            
            // game instance of this entity
            ig.game.player = this;
        },
        
        update: function() {
            
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.checkPosition();
            this.parent();
        },
        
        draw: function() {
            this.parent();
            
            ig.game.imageDotYellow.draw( this.origin.x - ig.game.screen.x, this.origin.y - ig.game.screen.y );
            ig.game.imageDotYellow.draw( this.target.x - ig.game.screen.x, this.target.y - ig.game.screen.y );
            //ig.game.imageDotYellow.draw( this.vertex.x - ig.game.screen.x, this.vertex.y - ig.game.screen.y );
        },
        
        checkStatus: function() {
        
            // update direction facing
            if ( ! this.hurting && ! this.dying ) {
                if ( ig.input.state('left') ) {
                    this.flip = true;
                }
                else if ( ig.input.state('right') ) {
                    this.flip = false;
                }
            }
            
            // toggle invincibility
            if ( ig.input.pressed('invincible') ) {
                this.isInvincible = this.isInvincible ? false : true;
            }
            
            // check entity status
            this.isLeaping();
            //this.isHurting();
            //this.isCrouching();
            //this.isJumping();
            //this.isMoving();
            this.animate();
        },
        
        isLeaping: function() {
            
            // if falling
            if ( this.vel.y > 0 && ! this.standing ) {
                this.falling = true;
                return;
            }
            
            if ( this.leaping && this.standing ) {
                this.vel.x = 0;
                this.vel.y = 0;
                this.leaping = false;
                this.jumping = false;
                this.falling = false;
            }
            
            /**/
            // http://en.wikipedia.org/wiki/Trajectory_of_a_projectile
            // http://stackoverflow.com/questions/1972315/need-help-deciphering-a-formula-for-projectile-motion
            if ( ! this.leaping ) {
                if ( ig.input.released('click') ) {
                    
                    this.origin.x = this.pos.x;
                    this.origin.y = this.pos.y;
                    this.target.x = ( ig.input.mouse.x + ig.game.screen.x );
                    this.target.y = ( ig.input.mouse.y + ig.game.screen.y );
                    
                    var g = ig.game.gravity;
                    
                    // target x
                    var x = ( this.target.x - this.pos.x );
                    x = ( x >  200 ?  200 : x );
                    x = ( x < -200 ? -200 : x );
                    
                    // target y
                    var y = 0; //( this.target.y - this.pos.y );
                    
                    // i need to make a rate for the velocity
                    var v = 100; // velocity
                    v = Math.abs( x ) + 120; // Math.sqrt( x * x ) + 120;
                    v = ( v > 300 ? 300 : v );
                    
                    // derivation
                    var tmp = ( v * v * v * v ) - g * ( g * ( x * x ) + 2 * y * ( v * v ) );
                    if ( tmp > 0 ) {
                       var angle1 = Math.atan( ( ( v * v ) + Math.sqrt(tmp) ) / ( g * x ) );
                       var angle2 = Math.atan( ( ( v * v ) - Math.sqrt(tmp) ) / ( g * x ) );
                       
                       var xVel = ( v * Math.cos(angle1) );
                       var yVel = ( v * Math.sin(angle1) );
                       
                       this.maxVel.x = 1000;
                       this.maxVel.y = 1000;
                       
                       this.vel.x = xVel * ( x > 0 ? 1 : -1 );
                       this.vel.y = yVel * ( yVel > 0 ? -1 : 1 );
                    }
                    
                    this.leaping = true;
                    this.jumping = true;
                }
            }
            /**/
            
            /** /
            if ( ig.input.released('click') ) {
                this.target = {};
                this.target.x = ( ig.input.mouse.x + ig.game.screen.x );
                this.target.y = ( ig.input.mouse.y + ig.game.screen.y );
                
                var distance = ( this.target.x - this.pos.x );
                var maxHeight = 40;
                
                // Y = Yo + Vot+ 1/2at^2 
                // Y is maximum height 
                // Yo is initial vertical placement 
                // Vo is velocity 
                // a is always equal to g which is in this case -9.8m/s^2 
                // t is time needed to reach point
                
                this.vertex = {};
                this.vertex.x = ( this.pos.x + ( distance / 2 ) );
                this.vertex.y = this.pos.y - maxHeight;
                
                var speed = 200;
                var gravity = ig.game.gravity;
                var angle = Math.atan2( ( this.vertex.y - this.pos.y ), ( this.vertex.x - this.pos.x ) );
                
                // g = 9.81; // gravity
                // x = 49; // target x
                // y = 0; // target y
                // o = 45; // launch angle
                // v = (sqrt(g) * sqrt(x) * sqrt((tan(o)*tan(o))+1)) / sqrt(2 * tan(o) - (2 * g * y) / x); // velocity
                //var v1 = ( Math.sqrt(gravity) * Math.sqrt(gravity) * Math.sqrt( ( Math.tan(angle) * Math.tan(angle) ) + 1 ) );
                //var v2 = Math.sqrt( 2 * Math.tan(angle) - ( 2 * gravity * this.target.y ) / this.target.x );
                //var speed = ( v1 / v2 );
                
                // initial velocity = sqrt( d * g ) / ( sin2theta)
                var v = Math.sqrt( distance * gravity ) / ( Math.sin(angle) * Math.sin(angle) );
                //var v = Math.sqrt( ( distance * gravity ) / ( Math.sin(angle * 2) ) );
                
                this.vel.x = v * Math.cos(angle);
                this.vel.y = v * Math.sin(angle);
                
                this.leaping = true;
            }
            /**/
            
            /** /
            // http://en.wikipedia.org/wiki/Trajectory
            // this kinda works but has very narrow angle and move extremely fast
            if ( ig.input.released('click') ) {
                this.target = {};
                this.target.x = ( ig.input.mouse.x + ig.game.screen.x );
                this.target.y = ( ig.input.mouse.y + ig.game.screen.y );
                
                var v = 200;
                var g = ig.game.gravity;
                var R = this.target.x - this.pos.x;
                r = Math.sqrt( R * R );
                
                // theta is angle, g is gravity, R is range, v is initial velocity
                // theta = 0.5 * asin( (g * R) / (v * v) )
                
                var angle1 = ( Math.asin( ( g * r ) / ( v * v ) ) / 2 );
                var angle2 = (  Math.sin( ( g * r ) / ( v * v ) ) / 2 );
                console.log('angle:', (angle1).toDeg(), (angle2).toDeg());
                
                var angle = angle2;
                if ( ! isNaN(angle) ) {
                
                    var x = v * Math.cos(angle);
                    var y = v * Math.sin(angle);
                    
                    //var range1 = 2 * x * y / g;
                    //var range2 = ((v * v) * Math.sin(2 * angle)) / g;
                    //console.log('range:', r, range1, range2);
                    
                    var H = (y * y) / (2 * g);
                    //console.log('height:', H);
                    
                    this.maxVel.x = 1000;
                    this.maxVel.y = 1000;
                    
                    this.vel.x = x * ( R > 0 ? 1 : -1);
                    this.vel.y = -y;
                    //console.log('velocity:', x, y);
                }
                
                this.leaping = true;
            }
            /**/
            
        },
        
        // check if hurting
        isHurting: function() {
            
            // if dying, kill this entity when the animation ends
            if ( this.dying ) {
                if ( this.currentAnim == this.anims.dead ) {
                    if ( this.currentAnim.loopCount ) {
                        this.kill();
                    }
                }
            }
            
            // if hurting, stop hurting when the animation ends
            if ( this.hurting ) {
                if ( this.currentAnim == this.anims.hurt ) {
                    if ( this.currentAnim.loopCount ) {
                        this.hurting = false;
                    }
                }
            }
            
        },
        
        // check if crouching
        isCrouching: function() {
            
            if ( this.hurting || this.dying || this.jumping || this.falling ) {
                return;
            }
            
            // if standing on something and just pressed "DOWN" button
            if ( ! this.crouching ) {
                if ( this.standing && ig.input.state('down') ) {
                    this.crouching = true;
                    this.vel.x = 0;
                    this.updateCollisionBox();
                    return;
                }
            }
            // else, if crouching and no longer pressing "DOWN" button
            else {
                if ( ! ig.input.state('down') ) {
                    this.crouching = false;
                    this.updateCollisionBox();
                }
            }
            
        },
        
        // check if jumping
        isJumping: function() {
            
            if ( this.hurting || this.dying || this.crouching ) {
                this.jumping = false;
                this.falling = false;
                return;
            }
            
            // if standing on something and just pressed "JUMP" button
            if ( this.standing && ig.input.pressed('jump') ) {
                this.jumping = true;
                this.vel.y = -this.jump;
                return;
            }
            
            // reduce jumping height
            if ( this.jumping && ig.input.released('jump') ) {
                this.vel.y = ( this.vel.y / 2 );
            }
            
            // if falling
            if ( this.vel.y > 0 && ! this.standing ) {
                this.falling = true;
                return;
            }
            
            // if standing on something while jumping/falling
            if ( ( this.jumping || this.falling ) && this.standing ) {
                this.jumping = false;
                this.falling = false;
            }
            
        },
        
        // checking if idle or moving left/right
        isMoving: function() {
        
            if ( this.hurting || this.dying || this.crouching ) {
                this.walking = false;
                return;
            }
            
            // if moving left
            if ( ig.input.state('left') ) {
                this.walking = true;
                this.vel.x = -(this.speed);
            }
            // else, if moving right
            else if ( ig.input.state('right') ) {
                this.walking = true;
                this.vel.x = this.speed;
            }
            // else, if standing still
            else {
                this.walking = false;
                this.vel.x = 0;
            }
            
        },
        
        // update entity animation
        animate: function() {
            
            // update entitiy opacity
            if ( this.hurting || this.isInvincible ) {
                this.currentAnim.alpha = 0.5;
            }
            else if ( this.currentAnim.alpha < 1 ) {
                this.currentAnim.alpha = 1;
            }
            
            // update animation state
            if ( this.dying ) {
                if ( this.currentAnim != this.anims.dead ) {
                    this.currentAnim = this.anims.dead.rewind();
                }
            }
            else if ( this.hurting ) {
                if ( this.currentAnim != this.anims.hurt ) {
                    this.currentAnim = this.anims.hurt.rewind();
                }
            }
            else if ( this.crouching ) {
                if ( this.currentAnim != this.anims.crouch ) {
                    this.currentAnim = this.anims.crouch.rewind();
                }
            }
            else if ( this.falling ) {
                if ( this.currentAnim != this.anims.fall ) {
                    this.currentAnim = this.anims.fall.rewind();
                }
            }
            else if ( this.jumping ) {
                if ( this.currentAnim != this.anims.jump ) {
                    this.currentAnim = this.anims.jump.rewind();
                }
            }
            else if ( this.walking ) {
                if ( this.currentAnim != this.anims.walk ) {
                    this.currentAnim = this.anims.walk.rewind();
                }
            }
            else {
                if ( this.currentAnim != this.anims.idle ) {
                    this.currentAnim = this.anims.idle.rewind();
                }
            }
            
            // update facing direction
            this.currentAnim.flip.x = this.flip;
        },
        
        // check if this entity needs repositioned
        checkPosition: function() {
            
            // if this entity has moved off the map
            if ( this.pos.x < ig.game.camera.offset.x.min ) {
                this.pos.x = ( ig.game.collisionMap.pxWidth - ig.game.camera.offset.x.max - ( this.size.x * 2 ) );
            }
            else if ( ( this.pos.x + this.size.x ) > ( ig.game.collisionMap.pxWidth - ig.game.camera.offset.x.max ) ) {
                this.pos.x = ( ig.game.camera.offset.x.min + this.size.x );
            }
            
            // if this entity has fallen off the map
            if ( this.pos.y > ig.game.collisionMap.pxHeight ) {
                this.pos.y = 0;
            }
            
        },
        
        // update the size of the collision box
        updateCollisionBox: function() {
            
            if ( this.jumping || this.falling ) {
                this.size = {x: 6, y: 5};
                this.offset = {x: 5, y: 9};
            } else {
                this.size = this.sizeReset
                this.offset = this.offsetReset;
            }
            
        },
        
        // called when overlapping with an entity whose .checkAgainst property matches this entity
        receiveDamage: function( amount, from ) {
        
            if ( this.hurting || this.dying || this.isInvincible ) {
                return;
            }
            
            /*
            // reduce health
            this.health -= amount;
            
            // if dead
            if ( this.health <= 0 ) {
                this.vel.x = 0;
                this.vel.y = 0;
                this.maxVel.x = 0;
                this.maxVel.y = 0;
                this.dying = true;
                return true;
            }
            
            // update state
            this.hurting = true;
            
            // apply knockback
            this.vel.x = ( from.pos.x > this.pos.x ) ? -200 : 200;
            this.vel.y = -150;
            */
            
            return true;
        },
        
    });
});