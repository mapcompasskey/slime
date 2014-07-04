ig.module(
    'game.entities.knight'
)
.requires(
    'impact.entity',
    'impact.entity-pool',
    'game.entities.enemy'
)
.defines(function() {
    EntityKnight = EntityEnemy.extend({
        
        attack_1: false,
        attack_2: false,
        attack_3: false,
        attack_4: false,
        attackTimer: null,
        animSheet: new ig.AnimationSheet( 'media/knight.png', 39, 39 ),
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
        },
        
        // add custom entity animations
        addAnimations: function() {
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
        },
        
        // resurrect this entity from the entity pool (pooling enabled below)
        reset: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            this.prepareEntity();
        },
        
        // reset parameters
        prepareEntity: function() {
            
            // reset parameters
            this.attack_1 = false;
            this.attack_2 = false;
            this.attack_3 = false;
            this.attack_4 = false;
            
            this.parent();
        },
        
        // check if attacking
        isAttacking: function() {
        
            if ( this.hurting || this.dying ) {
                this.attacking = false;
                return;
            }
            
            // if the player entity exist
            if ( ig.game.player ) {
            
                // if entity is attacking
                if ( this.attacking ) {
                    
                    /*
                    // lunge forward to attack
                    if ( this.currentAnim == this.anims.attack ) {
                        if ( this.currentAnim.frame > 2 && this.currentAnim.frame < 6 ) {
                            this.vel.x = ( this.flip ? -200 : 200 );
                        } else {
                            this.vel.x = 0;
                        }
                    }
                    
                    // stop attacking when animation ends
                    if ( this.currentAnim == this.anims.attack ) {
                        if ( this.currentAnim.loopCount ) {
                            this.attacking = false;
                        }
                    }
                    */
                    
                    if ( this.attackTimer.delta() > 0 ) {
                        this.vel.x = 0;
                        this.attacking = false;
                        this.attack_1 = false;
                        this.attack_2 = false;
                        this.attack_3 = false;
                        this.attack_4 = false;
                    }
                    else if ( this.attackTimer.delta() > -0.2 ) {
                        this.attack_4 = true;
                        this.vel.x = 0
                    }
                    else if ( this.attackTimer.delta() > -1.0 ) {
                        this.attack_2 = true;
                        this.vel.x = ( this.flip ? -200 : 200 );
                    }
                    else {
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
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            if ( this.attacking ) {
                if ( this.attack_2 ) {
                    this.attack_3 = true;
                }
                other.receiveDamage( 1, this );
            }
            
        },
        
    });
    
    ig.EntityPool.enableFor( EntityKnight );
});