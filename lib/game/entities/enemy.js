ig.module(
    'game.entities.enemy'
)
.requires(
    'impact.entity'
)
.defines(function() {
    EntityEnemy = ig.Entity.extend({
        
        size: {x: 9, y: 24},
        offset: {x: 15, y: 15},
        maxVel: {x: 300, y: 220},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 40,
        jump: 220,
        health: 4,
        maxHealth: 4,
        animSheet: null,
        
        proximity: 100,
        actionTimer: null,
        
        idling: false,
        hurting: false,
        dying: false,
        jumping: false,
        falling: false,
        attacking: false,
        
        type: ig.Entity.TYPE.B, // add to enemy group
        checkAgainst: ig.Entity.TYPE.A, // check collisions against friendly group
        collides: ig.Entity.COLLIDES.PASSIVE,
        _wmIgnore: true, // tells Weltmeister editor to ignore this entity
        
        init: function( x, y, settings ) {
            this.parent( x, y, settings );
                        
            // add the animations
            this.addAnimations();
            this.prepareEntity();
        },
        
        // add custom entity animations
        addAnimations: function() {
            //this.addAnim( 'idle', 1.0, [0], true );
            //this.addAnim( 'walk', 0.2, [1, 2] );
            //this.addAnim( 'attack', 0.5, [3, 3, 4], true );
            //this.addAnim( 'hurt', 0.1, [5, 5, 5], true );
            //this.addAnim( 'dead', 0.1, [5, 6, 6], true );
        },
              
        // reset parameters
        prepareEntity: function() {
            
            // reset parameters
            this.health = this.maxHealth;
            
            this.idling = false;
            this.hurting = false;
            this.dying = false;
            this.jumping = false;
            this.falling = false;
            this.attacking = false;
            
            // set entity action
            this.updateAction();
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.checkPosition();
            this.parent();
        },
        
        checkStatus: function() {
            
            // if action timer ended
            if ( this.actionTimer ) {
                if ( this.actionTimer.delta() > 0 ) {
                    this.updateAction();
                }
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
            
            // stop hurting when the animation ends
            if ( this.hurting ) {
                if ( this.currentAnim == this.anims.hurt ) {
                    if ( this.currentAnim.loopCount ) {
                        this.hurting = false;
                    }
                }
            }
            
            // stop moving if falling and hitting the ground
            if ( this.hurting ) {
                if ( this.falling && this.standing ) {
                    this.vel.x = 0;
                }
            }
            
        },
        
        // check if attacking
        isAttacking: function() {
        
            if ( this.hurting || this.dying ) {
                this.attacking = false;
                return;
            }
            
        },
        
        // check if jumping
        isJumping: function() {
            
            if ( this.dying ) {
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
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying || this.attacking ) {
                return;
            }
            
            if ( this.walking ) {
                this.vel.x = this.speed * ( this.flip ? -1 : 1 );
            } else {
                this.vel.x = 0;
            }
            
        },
        
        // update entity animation
        animate: function() {
            
            // update entitiy opacity
            //if ( this.hurting || this.dying ) {
                //this.currentAnim.alpha = 0.5;
            //}
            //else if ( this.currentAnim.alpha < 1 ) {
                //this.currentAnim.alpha = 1;
            //}
            
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
            else if ( this.attacking ) {
                if ( this.currentAnim != this.anims.attack ) {
                    this.currentAnim = this.anims.attack.rewind();
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
            
            // if entity has reached the edge of a platform
            if ( ! this.hurting && ! this.jumping && ! this.falling ) {
                var xPos = this.pos.x + ( this.flip ? -1 : this.size.x + 1 );
                var yPos = ( this.pos.y + this.size.y + 1 );
                if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                    this.flip = !this.flip;
                    this.vel.x = ( this.vel.x > 0 ? -this.vel.x : this.vel.x );
                }
            }
            
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
                
        // update entity action
        updateAction: function() {
            
            if ( this.hurting || this.dying || this.attacking ) {
                return;
            }
            
            // get a random number 1 - 5
            var num = Math.floor( ( Math.random() * 5 ) + 1 );
            switch ( num ) {
                // walk right
                case 5:
                case 4:
                    this.flip = false;
                    this.walking = true;
                    break;
                
                // walk left
                case 3:
                case 2:
                    this.flip = true;
                    this.walking = true;
                    break;
                
                // stand still
                default:
                    this.walking = false;
            }
            
            // reset action timer to 1 - 5 seconds
            var timer = Math.floor( ( Math.random() * 5 ) + 1 );
            this.actionTimer = new ig.Timer( timer );
        },
        
        handleMovementTrace: function( res ) {
            this.parent( res );
            
            // turn around if hitting a wall
            if ( res.collision.x ) {
                this.flip = ! this.flip;
            }
            
        },
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            other.receiveDamage( 1, this );
        },
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
        
            if ( this.hurting || this.dying ) {
                return false;
            }
            
            // reduce health
            //this.health -= amount;
            
            // if dead
            if ( this.health <= 0 ) {
                this.vel = {x: 0, y: 0};
                this.maxVel = {x: 0, y: 0};
                this.dying = true;
                return true;
            }
            
            // update state
            this.hurting = true;
            
            // apply knockback
            this.vel.x = ( from.flip ? -80 : 80 );
            this.vel.y = -80;
            
            return true;
        },
        
    });
});