ig.module(
    'game.entities.knight'
)
.requires(
    'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntityKnight = ig.Entity.extend({
        
        size: {x: 9, y: 24},
        offset: {x: 15, y: 15},
        maxVel: {x: 900, y: 900},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 40,
        jump: 220,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/knight.png', 39, 39 ),
        
        jumpTo: null,
        proximity: 100,
        actionTimer: null,
        
        idling: false,
        hurting: false,
        dying: false,
        jumping: false,
        falling: false,
        attack_1: false,
        attack_2: false,
        attack_3: false,
        attack_4: false,
        attacking: false,
        
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        _wmIgnore: true, // tells Weltmeister editor to ignore this entity
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
                                    
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.2, [1, 0, 2, 0] );
            this.addAnim( 'jump', 1, [3], true );
            this.addAnim( 'fall', 1, [3], true );
            //this.addAnim( 'attack', 0.2, [6, 6, 6, 8, 7, 8, 9], true );
            this.addAnim( 'attack', 1, [6], true );
            this.addAnim( 'attack_1', 1, [6], true );
            this.addAnim( 'attack_2', 1, [7], true );
            this.addAnim( 'attack_3', 1, [8], true );
            this.addAnim( 'attack_4', 1, [9], true );
            this.addAnim( 'hurt', 0.3, [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5], true );
            this.addAnim( 'dead', 0.2, [6, 6, 6], true );
            
            this.prepareEntity();
        },
        
        // resurrect this entity from the entity pool (pooling enabled below)
        reset: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            this.prepareEntity();
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
            this.attack_1 = false;
            this.attack_2 = false;
            this.attack_3 = false;
            this.attack_4 = false;
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
            this.isJumping();
            this.isAttacking();
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
        
        // check if jumping
        isJumping: function() {
            
            if ( this.dying ) {
                this.jumping = false;
                this.falling = false;
                return;
            }
            
            // if jump to position is set
            if ( this.jumpTo ) {
                if ( this.jumpTo.x && this.jumpTo.y ) {
                    
                    // starting vector
                    var origin = {};
                    origin.x = this.pos.x + ( this.size.x / 2 );
                    origin.y = this.pos.y + this.size.y;
                    
                    // ending vector
                    var target = {};
                    target.x = this.jumpTo.x;
                    target.y = this.jumpTo.y - ig.game.tileSize;
                    
                    // speed
                    var duration = 0.75;
                    
                    var xVel = ( ( target.x - origin.x ) / duration );
                    var yVel = ( ( target.y + 0.5 * -(ig.game.gravity) * duration * duration - origin.y ) / duration );
                    
                    // set velocity
                    this.vel.x = xVel;
                    this.vel.y = yVel;
                    
                    this.jumpTo = null;
                    this.jumping = true;
                    return;
                }
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
        
        // check if attacking
        isAttacking: function() {
        
            if ( this.hurting || this.dying || this.jumping ) {
                this.attacking = false;
                return;
            }
            
            // if the player entity exist
            if ( ig.game.player ) {
            
                // if entity is attacking
                if ( this.attacking ) {
                    if ( this.attackTimer.delta() > 0 ) {
                        // attack has ended
                        this.vel.x = 0;
                        this.attacking = false;
                        this.attack_1 = false;
                        this.attack_2 = false;
                        this.attack_3 = false;
                        this.attack_4 = false;
                    }
                    else if ( this.attackTimer.delta() > -0.2 ) {
                        // forward rush has ended
                        this.attack_4 = true;
                        this.vel.x = 0
                    }
                    else if ( this.attackTimer.delta() > -1.0 ) {
                        // rushing forward
                        this.attack_2 = true;
                        this.vel.x = ( this.flip ? -200 : 200 );
                    }
                    else {
                        // preparing to attack
                        this.vel.x = 0;
                    }
                } else {
                    
                    // if on the same level as the enemy
                    if ( ig.game.player.pos.y > ( this.pos.y - this.size.y ) )
                    {
                        var facing = false;
                        if ( ig.game.player.pos.x < this.pos.x ) {
                            facing = ( this.flip ? true : false );
                        } else {
                            facing = ( this.flip ? false : true );
                        }
                        
                        // if facing the player
                        if ( facing ) {
                        
                            // if the player is within range
                            var distance = this.distanceTo( ig.game.player );
                            if ( distance < this.proximity ) {
                                this.attacking = true;
                                this.attack_1 = true;
                                this.attack_2 = false;
                                this.attack_3 = false;
                                this.attack_4 = false;
                                this.attackTimer = new ig.Timer(1.5);
                            }
                            
                        }
                        
                    }
                    
                }
                
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying || this.jumping || this.attacking ) {
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
                if ( this.attack_4 ) {
                    if ( this.currentAnim != this.anims.attack_4 ) {
                        this.currentAnim = this.anims.attack_4.rewind();
                    }
                }
                else if ( this.attack_3 ) {
                    if ( this.currentAnim != this.anims.attack_3 ) {
                        this.currentAnim = this.anims.attack_3.rewind();
                    }
                }
                else if ( this.attack_2 ) {
                    if ( this.currentAnim != this.anims.attack_2 ) {
                        this.currentAnim = this.anims.attack_2.rewind();
                    }
                }
                else if ( this.attack_1 ) {
                    if ( this.currentAnim != this.anims.attack_1 ) {
                        this.currentAnim = this.anims.attack_1.rewind();
                    }
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
                    this.getJumpTo();
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
                this.kill();
            }
            
        },
        
        // get the tile to jump to
        getJumpTo: function() {
            
            // starting vector
            var xPos = ( this.pos.x + ( this.size.x / 2 ) );
            var yPos = ( this.pos.y + this.size.y );
            
            var tileSize = ig.game.tileSize;
            var xTile = xPos;
            var yTile = yPos;
            
            // find a tile directory ahead
            for ( var x = 2; x < 15; x++ ) {
                xTile = xPos + ( x * tileSize * ( this.flip ? -1 : 1 ) );
                
                // if a tile is found
                if ( ig.game.collisionMap.getTile( xTile, yTile ) ) {
                    xTile += ( this.size.x * ( this.flip ? -1 : 1 ) );
                    this.jumpTo = {x: xTile, y: yTile};
                    return;
                }
            }
            
            // turn around if no tile is found
            this.flip = !this.flip;
            this.vel.x = ( this.vel.x > 0 ? -this.vel.x : this.vel.x );
        },
        
        // update entity action
        updateAction: function() {
            
            if ( this.hurting || this.dying || this.attacking ) {
                return;
            }
            
            this.flip = true;
            this.walking = true;
            return;
            
            /*
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
            */
        },
        
        handleMovementTrace: function( res ) {
            this.parent( res );
            
            // turn around if hitting a wall
            if ( res.collision.x ) {
                this.flip = ! this.flip;
                this.attacking = false;
            }
            
        },
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            // only cause damage if rushing forward
            if ( this.attacking ) {
                if ( this.attack_2 ) {
                    this.attack_3 = true;
                    other.receiveDamage( 1, this );
                }
            }
            
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
    
    ig.EntityPool.enableFor( EntityKnight );
});