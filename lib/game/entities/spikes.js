ig.module(
    'game.entities.spikes'
)
.requires(
    'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntitySpikes = ig.Entity.extend({
        
        name: 'spikes',
        size: {x: 40, y: 10},
        offset: {x: 0, y: 0},
        maxVel: {x: 0, y: 0},
        friction: {x: 0, y: 0},
        flip: false,
        speed: 0,
        jump: 0,
        health: 0,
        animSheet: new ig.AnimationSheet( 'media/spikes.png', 40, 10 ),
        
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        _wmIgnore: true, // tells Weltmeister editor to ignore this entity
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
                                    
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
        },
        
        // resurrect this entity from the entity pool (pooling enabled below)
        reset: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.parent();
        },
        
        checkStatus: function() {
            
            // check entity status
            this.animate();
            
        },
        
        // update entity animation
        animate: function() {
            
            // update animation state
            if ( this.currentAnim != this.anims.idle ) {
                this.currentAnim = this.anims.idle.rewind();
            }
            
        },
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
        
            if ( other.name == 'knight' || other.name == 'wizard' ) {
                other.receiveDamage( 0, this );
            }
            
            return;
        },
        
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
            return;
        },
        
    });
    
    ig.EntityPool.enableFor( EntitySpikes );
});