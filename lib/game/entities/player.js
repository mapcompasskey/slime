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
        maxVel: {x: 1000, y: 1000},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 20,
        jump: 0,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/player.png', 16, 16 ),
        
        reset: {x: 0, y: 0},
        origin: {x: 0, y: 0},
        vertex: {x: 0, y: 0},
        target: {x: 0, y: 0},
        isInvincible: false,
        attackCounter: 0,
        imageDotYellow: new ig.Image( 'media/dot-yellow.png' ),
        
        walking: false,
        jumping: false,
        falling: false,
        charging: false,
        attacking: false,
        hurting: false,
        dying: false,
        
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            
            // set starting position
            this.reset.x = x;
            this.reset.y = y;
            
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.4, [2, 0] );
            this.addAnim( 'jump', 1, [4], true );
            this.addAnim( 'fall', 1, [5], true );
            this.addAnim( 'attack', 1, [14], true );
            this.addAnim( 'charge_1', 0.1, [0, 9, 0, 10, 0, 11], true );
            this.addAnim( 'charge_2', 0.1, [5, 12, 5, 13, 5, 14], true );
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
            
            this.imageDotYellow.draw( this.origin.x - ig.game.screen.x, this.origin.y - ig.game.screen.y );
            this.imageDotYellow.draw( this.target.x - ig.game.screen.x, this.target.y - ig.game.screen.y );
        },
        
        checkStatus: function() {
        
            // update direction facing
            if ( ! this.hurting && ! this.dying ) {
                //if ( ig.input.state('left') ) {
                if ( this.vel.x < 0 ) {
                    this.flip = true;
                }
                //else if ( ig.input.state('right') ) {
                if ( this.vel.x > 0 ) {
                    this.flip = false;
                }
            }
            
            // toggle invincibility
            if ( ig.input.pressed('invincible') ) {
                this.isInvincible = this.isInvincible ? false : true;
            }
            
            // check entity status
            this.isHurting();
            this.isAttacking();
            this.isJumping();
            this.isMoving();
            this.animate();
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
            //if ( this.hurting ) {
                //if ( this.currentAnim == this.anims.hurt ) {
                    //if ( this.currentAnim.loopCount ) {
                        //this.hurting = false;
                    //}
                //}
            //}
            
            // if hurting, stop when this entity hits the ground
            if ( this.hurting ) {
                if ( this.falling && this.standing ) {
                    this.hurting = false;
                }
            }
            
        },
        
        // check if attacking
        isAttacking: function() {
            
            if ( this.hurting || this.dying ) {
                this.charging = false;
                this.attacking = false;
                return;
            }
            
            if ( this.attacking ) {
                
                // should problably be invincible while attacking
                
                // if collided with the ground
                if ( this.standing ) {
                    this.attacking = false;
                    return;
                }
                
            }
            
            if ( ! this.attacking ) {
            
                // if holding the mouse down
                if ( ig.input.state('click') ) {
                    this.charging = true;
                }
                
                // if the mouse was just released
                if ( ig.input.released('click') ) {
                
                    // if at the end of the charging animation
                    if ( this.currentAnim == this.anims.charge_1 || this.currentAnim == this.anims.charge_2 ) {
                        if ( this.currentAnim.loopCount ) {
                        
                            // get starting and ending vectors
                            this.origin.x = this.pos.x + ( this.size.x / 2 );
                            this.origin.y = this.pos.y + this.size.y;
                            this.target.x = ( ig.input.mouse.x + ig.game.screen.x );
                            this.target.y = ( ig.input.mouse.y + ig.game.screen.y );
                            
                            // get angle from vectors
                            var radians =  Math.atan2( ( this.target.y - this.origin.y ), ( this.target.x - this.origin.x ) );
                            
                            // set horizontal and vertical velocity
                            this.vel.x = ( 400 * Math.cos( radians ) );
                            this.vel.y = ( 400 * Math.sin( radians ) );
                            
                            this.attacking = true;
                        }
                    }
                
                    this.charging = false;
                }
                
            }
            
        },
        
        // check if jumping
        isJumping: function() {
            
            //if ( this.hurting || this.dying || this.attacking ) {
            if ( this.dying || this.attacking ) {
                this.jumping = false;
                this.falling = false;
                return;
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
            
            // if standing on something and just clicked the mouse button
            if ( this.standing ) {
                if ( ig.input.released('click') ) {
                    
                    this.origin.x = this.pos.x + ( this.size.x / 2 );
                    this.origin.y = this.pos.y + this.size.y;
                    this.target.x = ( ig.input.mouse.x + ig.game.screen.x );
                    this.target.y = ( ig.input.mouse.y + ig.game.screen.y );
                    
                    var adjacent = this.target.x - this.origin.x;
                    var opposite = this.target.y - this.origin.y;
                    var hypotenuse = Math.sqrt( (adjacent * adjacent) + (opposite * opposite) );
                    
                    var gravity = -ig.game.gravity;
                    var duration = ( hypotenuse / 100 );
                    duration = ( duration > 1.25 ? 1.25 : duration );
                    
                    // http://gamedev.stackexchange.com/questions/17467/calculating-velocity-needed-to-hit-target-in-parabolic-arc
                    // T = Target, O = Origin
                    // xVel = (Tx - Ox) / duration
                    // yVel = (Ty + 0.5 * gravity * duration * duration - Oy) / duration
                    
                    var xVel = ( ( this.target.x - this.origin.x ) / duration );
                    var yVel = ( ( this.target.y + 0.5 * gravity * duration * duration - this.origin.y ) / duration );
                    
                    this.vel.x = xVel;
                    this.vel.y = yVel;
                    
                    this.jumping = true;
                }
            }
            
        },
        
        // check if idle or moving left/right
        isMoving: function() {
        
            if ( this.hurting || this.dying || this.attacking || this.jumping ) {
                this.walking = false;
                return;
            }
            
            // can't move if standing on ground and charging
            if ( this.charging && this.standing ) {
                this.walking = false;
                this.vel.x = 0;
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
            // else, if standing still on the ground
            else if ( this.standing) {
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
            else if ( this.charging ) {
                if ( this.jumping || this.falling ) {
                    if ( this.currentAnim != this.anims.charge_2 ) {
                        this.currentAnim = this.anims.charge_2.rewind();
                    }
                }
                else if ( this.currentAnim != this.anims.charge_1 ) {
                    this.currentAnim = this.anims.charge_1.rewind();
                }
            }
            else if ( this.falling ) {
                if ( this.currentAnim != this.anims.fall ) {
                    this.currentAnim = this.anims.fall.rewind();
                }
            }
            else if ( this.attacking ) {
                if ( this.currentAnim != this.anims.attack ) {
                    this.currentAnim = this.anims.attack.rewind();
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
                //this.pos.y = 0;
                this.pos.x = this.reset.x;
                this.pos.y = this.reset.y - 10;
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
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            if ( this.attacking ) {
            
                // if caused damage
                if ( other.receiveDamage( 0, this ) ) {
                    this.attacking = false;
                    
                    // apply knockback
                    this.vel.x = ( this.vel.x > 0 ? -80 : 80 );
                    this.vel.y = -80;
                }
                
            }
        },
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
        
            if ( this.hurting || this.dying || this.isInvincible ) {
                return;
            }
            
            /**/
            // reduce health
            //this.health -= amount;
            
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
            this.vel.x = ( from.pos.x > this.pos.x ) ? -60 : 60;
            this.vel.y = -80;
            /**/
            
            return true;
        },
        
    });
});