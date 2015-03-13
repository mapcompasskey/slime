ig.module(
    'game.entities.boulder'
)
.requires(
    'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntityBoulder = ig.Entity.extend({
        
        name: 'boulder',
        size: {x: 16, y: 20},
        offset: {x: 2, y: 0},
        maxVel: {x: 900, y: 900},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 40,
        jump: 220,
        health: 0,
        animSheet: new ig.AnimationSheet( 'media/boulder.png', 20, 20 ),
        
        resetPosition: {x: 0, y: 0},
        resetTime: 3,
        resetTimer: null,
        canMove: true,
        
        reseting: false,
        appearing: false,
        idling: false,
        hurting: false,
        jumping: false,
        falling: false,
        
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        _wmIgnore: true, // tells Weltmeister editor to ignore this entity
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
                                    
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'reset', 0.1, [1, 2, 3, 4], true );
            this.addAnim( 'appear', 0.1, [3, 2, 1, 0], true );
            
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
            this.reseting = false;
            this.appearing = false;
            this.idling = false;
            this.hurting = false;
            this.jumping = false;
            this.falling = false;
            
            this.resetPosition.x = 0;
            this.resetPosition.y = 0;
            
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
            
            // check entity status
            this.isReseting();
            this.isJumping();
            this.isMoving();
            this.animate();
            
        },
        
        // check if reseting
        isReseting: function() {
            
            // if the appear animation has ended
            if ( this.appearing ) {
                if ( this.currentAnim == this.anims.appear ) {
                    if ( this.currentAnim.loopCount ) {
                        this.canMove = true;
                        this.appearing = false;
                    }
                }
            }
            
            // if the reset animation has ended
            if ( this.reseting ) {
                if ( this.currentAnim == this.anims.reset ) {
                    if ( this.currentAnim.loopCount ) {
                        this.pos.x = this.resetPosition.x;
                        this.pos.y = this.resetPosition.y;
                        this.appearing = true;
                        this.reseting = false;
                    }
                }
            }
            
            // if reset timer ended
            if ( this.resetTimer ) {
                if ( this.resetTimer.delta() > 0 ) {
                    this.reseting = true;
                    this.resetTimer = null;
                }
            }
            
        },
        
        // check if jumping
        isJumping: function() {
            
            // if standing on something while jumping/falling
            if ( ( this.jumping || this.falling ) && this.standing ) {
                this.jumping = false;
                this.falling = false;
            }
            
            // if jumping
            if ( this.vel.y < 0 ) {
                this.jumping = true;
            }
            
            // if falling
            if ( this.vel.y > 0 ) {
                this.falling = true;
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.jumping || this.falling ) {
                return;
            }
            
            this.vel.x = 0;
        },
        
        // update entity animation
        animate: function() {
            
            // update animation state
            if ( this.reseting ) {
                if ( this.currentAnim != this.anims.reset ) {
                    this.currentAnim = this.anims.reset.rewind();
                }
            }
            else if ( this.appearing ) {
                if ( this.currentAnim != this.anims.appear ) {
                    this.currentAnim = this.anims.appear.rewind();
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
            
            // if this entity has fallen off the map, move it back to where it jumped from
            /*if ( this.pos.y > ig.game.collisionMap.pxHeight ) {
                this.pos.x = this.lastStanding.x;
                this.pos.y = this.lastStanding.y;
            }*/
            
        },
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            if ( this.falling ) {
                if ( other.name == 'wizard' || other.name == 'knight' ) {
                    if ( this.pos.y + ( this.size.y / 2 ) < other.pos.y ) {
                        other.receiveDamage( 0, this );
                    }
                }
            }
            return;
        },
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
            
            if ( ! this.canMove ) {
                return;
            }
            
            // begin reset timer
            this.canMove = false;
            this.resetPosition.x = this.pos.x;
            this.resetPosition.y = this.pos.y;
            this.resetTimer = new ig.Timer( this.resetTime );
            
            var direction = 1;
            if ( ( this.pos.x + this.size.x / 2 ) < ( from.pos.x + from.size.x / 2 ) ) {
                direction = -1;
            }
            
            // apply knockback
            //this.vel.x = ( from.flip ? -40 : 40 );
            this.vel.x = 40 * direction;
            this.vel.y = -80;
            
            return true;
        },
        
    });
    
    ig.EntityPool.enableFor( EntityBoulder );
});