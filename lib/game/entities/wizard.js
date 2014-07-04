ig.module(
    'game.entities.wizard'
)
.requires(
    'impact.entity',
    'impact.entity-pool',
    'game.entities.enemy'
)
.defines(function() {
    EntityWizard = EntityEnemy.extend({
        
        animSheet: new ig.AnimationSheet( 'media/wizard.png', 39, 39 ),
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
        },
        
        // add custom entity animations
        addAnimations: function() {
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.2, [1, 0, 2, 0] );
            this.addAnim( 'jump', 1, [3], true );
            this.addAnim( 'fall', 1, [3], true );
            this.addAnim( 'attack', 0.3, [6, 7, 6, 7, 6, 7, 8, 8], true );
            this.addAnim( 'hurt', 0.3, [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5], true );
            this.addAnim( 'dead', 0.2, [6, 6, 6], true );
        },
        
        // resurrect this entity from the entity pool (pooling enabled below)
        reset: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            this.prepareEntity();
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
                    this.vel.x = 0;
                    
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
                                this.attacking = true;
                            }
                            
                        }
                        
                    }
                    
                }
                
            }
            
        },
        
    });
    
    ig.EntityPool.enableFor( EntityWizard );
});