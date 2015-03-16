ig.module(
    'game.entities.wizard'
)
.requires(
    'impact.entity',
    'impact.entity-pool',
    'game.entities.wizard-spell'
)
.defines(function() {
    EntityWizard = ig.Entity.extend({
        
        name: 'wizard',
        size: {x: 9, y: 24},
        offset: {x: 15, y: 15},
        maxVel: {x: 900, y: 900},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 40,
        jump: 220,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/wizard.png', 39, 39 ),
        
        proximity: 100,
        jumpTo: null,
        lastStanding: null,
        actionTimer: null,
        entitySpell: null,
        hasAttacked: false,
        
        idling: false,
        hurting: false,
        dying: false,
        boulderDying: false,
        jumping: false,
        falling: false,
        attacking: false,
        teleporting: false,
        
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
            this.addAnim( 'attack', 0.3, [6, 7, 6, 7, 8, 8], true );
            this.addAnim( 'hurt', 0.3, [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5], true );
            this.addAnim( 'dead', 0.2, [6, 6, 6], true );
            this.addAnim( 'dead_boulder', 0.03, [9, 10, 11, 12,  13, 13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 16, 16, 16, 17], true );
            this.addAnim( 'teleport', 0.1, [25, 25, 18, 19, 20, 21, 22, 23, 24], true );
            
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
            this.idling = false;
            this.hurting = false;
            this.dying = false;
            this.boulderDying = false;
            this.jumping = false;
            this.falling = false;
            this.attacking = false;
            this.teleporting = false;
            
            // set entity action
            this.updateAction();
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            // track where this entity was last standing 
            if ( ! this.standing && this.lastStanding == null ) {
                this.lastStanding = {};
                this.lastStanding.x = this.last.x;
                this.lastStanding.y = this.last.y;
            }
            else if ( this.standing && this.lastStanding != null ) {
                this.lastStanding = null;
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
            this.isTeleporting();
            this.isJumping();
            this.isAttacking();
            this.isMoving();
            this.animate();
        },
        
        // check if hurting
        isHurting: function() {
            
            // if dying, kill this entity when the animation ends
            if ( this.boulderDying ) {
                if ( this.currentAnim == this.anims.dead_boulder ) {
                    if ( this.currentAnim.loopCount ) {
                        this.vel.x = 0;
                        ig.game.isWizardDead = true;
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
        
        // check if teleporting
        isTeleporting: function() {
            
            if ( this.teleporting ) {
                if (this.lastStanding) {
                    this.pos.x = this.lastStanding.x;
                    this.pos.y = this.lastStanding.y;
                }
                if ( this.currentAnim == this.anims.teleport ) {
                    if ( this.currentAnim.loopCount ) {
                        this.teleporting = false;
                    }
                }
            }
            
        },
        
        // check if jumping
        isJumping: function() {
            
            if ( this.dying || this.teleporting ) {
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
        
            if ( this.hurting || this.dying || this.jumping || this.teleporting ) {
                this.attacking = false;
                return;
            }
            
            // if the player entity exist
            if ( ig.game.player ) {
            
                // if entity is attacking
                if ( this.attacking ) {
                    this.vel.x = 0;
                    
                    // attack with a spell
                    if ( ! this.hasAttacked ) {
                        if ( this.currentAnim.frame == 4 ) {
                            this.hasAttacked = true;
                            var xPos = this.pos.x + ( this.flip ? -10 : 10 );
                            var yPos = this.pos.y + 8;
                            this.entitySpell = ig.game.spawnEntity( EntityWizardSpell, xPos, yPos, {flip: this.flip} );
                        }
                    }
                    
                    // stop attacking when animation ends
                    if ( this.currentAnim == this.anims.attack ) {
                        if ( this.currentAnim.loopCount ) {
                            this.attacking = false;
                        }
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
                                this.hasAttacked = false;
                                this.attacking = true;
                            }
                            
                        }
                        
                    }
                    
                }
                
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying || this.jumping || this.attacking || this.teleporting ) {
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
            if ( this.boulderDying ) {
                if ( this.currentAnim != this.anims.dead_boulder ) {
                    this.currentAnim = this.anims.dead_boulder.rewind();
                }
            }
            else if ( this.teleporting ) {
                if ( this.currentAnim != this.anims.teleport ) {
                    this.currentAnim = this.anims.teleport.rewind();
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
            
            // if this entity has fallen off the map, move it back to where it jumped from
            /*if ( this.pos.y > ig.game.collisionMap.pxHeight ) {
                this.hurting = false;
                this.pos.x = this.lastStanding.x;
                this.pos.y = this.lastStanding.y;
            }*/
            
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
            
            if ( this.hurting || this.dying || this.attacking || this.teleporting ) {
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
            }
            
        },
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            return;
        },
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
            
            if ( this.dying ) {
                return false;
            }
            
            // if not the wizard's spell
            if ( from == this.entitySpell ) {
                return false;
            }
            
            // if boulder
            if ( from.name == 'boulder' ) {
                this.dying = true;
                this.boulderDying = true;
                this.vel.x = ( this.vel.x > 0 ? 10 : -10 );
                this.vel.y = 0;
                return true;
            }
            
            // if spikes
            if ( from.name == 'spikes' ) {
                this.hurting = false;
                this.teleporting = true;
                this.vel.x = 0;
                this.vel.y = 0;
                return false;
            }
            
            if ( this.hurting ) {
                return false;
            }
            
            // apply knockback
            this.hurting = true;
            this.vel.x = ( from.flip ? -80 : 80 );
            this.vel.y = -80;
            
            return true;
        },
        
    });
    
    ig.EntityPool.enableFor( EntityWizard );
});