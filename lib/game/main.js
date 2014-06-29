ig.module( 
	'game.main' 
)
.requires(
    'impact.debug.debug',
	'impact.game',
	'impact.font',
    'plugins.simple-camera',
    'game.entities.player',
    'game.levels.area2'
)
.defines(function(){
    
    //
    // --------------------------------------------------------------------------
    // The Game Stage
    // --------------------------------------------------------------------------
    //
    GameStage = ig.Game.extend({
        
        //clearColor: null,
        clearColor: '#000000',
        isPaused: false,
        tileSize: 5,
        gravity: 400,
        
        posMouse_1: null,
        posMouse_2: null,
        imageDotBlue: new ig.Image('media/dot-blue.png'),
        imageDotYellow: new ig.Image('media/dot-yellow.png'),
        
        // initialize your game here
        init: function() {
            
            // bind keys
            ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
            ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
            ig.input.bind( ig.KEY.UP_ARROW, 'up' );
            ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );
            ig.input.bind( ig.KEY.X, 'jump' );
            ig.input.bind( ig.KEY.Z, 'attack' );
            ig.input.bind( ig.KEY.C, 'invincible' );
            ig.input.bind( ig.KEY.P, 'pause' );
            ig.input.bind( ig.KEY.MOUSE1, 'click' );
            
            this.loadLevel( LevelArea2 );
            
            // show collision boxes
            //ig.Entity._debugShowBoxes = true;
        },
        
        update: function() {
            this.parent();
            
            if ( ig.input.pressed('pause') ) {
                this.isPaused = !this.isPaused;
            }
            
            if ( ig.game.isPaused ) {
                return;
            }
            
            // update camera
            if ( this.player ) {
                if ( this.camera ) {
                    // camera follows the player
                    this.camera.follow( this.player );
                } else {
                    // center screen on the player
                    this.screen.x = ( this.player.pos.x - ( ig.system.width / 2 ) );
                    this.screen.y = ( this.player.pos.y - ( ig.system.height / 2 ) );
                }
            }
            
            this.setPoints();
        },
        
        draw: function() {
            this.parent();
            //this.drawTrajectoryPoints();
        },
        
        loadLevel: function( data ) {
            
            // remember the currently loaded level, so we can reload when the player dies.
            this.currentLevel = data;
            
            // call the parent implemenation. this creates the background maps and entities.
            this.parent( data );
            
            // setup camera plugin
            this.camera = new ig.SimpleCamera();
            this.camera.offset.x.min = 0;
            this.camera.offset.x.max = 0;
            this.camera.getMinMax();
            
            // spawn player
            ig.game.spawnEntity( EntityPlayer, ( this.tileSize * 4 ), ( this.tileSize * 16) );
        },
        
        setPoints: function() {
        
            if ( ig.input.released('click') ) {
            
                if ( this.posMouse_1 != null && this.posMouse_2 != null ) {
                    this.posMouse_1 = null;
                    this.posMouse_2 = null;
                }
                
                if ( this.posMouse_1 == null && this.posMouse_2 == null ) {
                    this.posMouse_1 = {
                        x: ( ig.input.mouse.x + ig.game.screen.x ),
                        y: ( ig.input.mouse.y + ig.game.screen.y ),
                    };
                }
                else if ( this.posMouse_2 == null ) {
                    this.posMouse_2 = {
                        x: ( ig.input.mouse.x + ig.game.screen.x ),
                        y: ( ig.input.mouse.y + ig.game.screen.y ),
                    };
                }
                
            }
            
        },
        
        drawTrajectoryPoints: function()
        {
            var offset = {};
            offset.x = ig.game.screen.x;
            offset.y = ig.game.screen.y;
            
            var origin = null;
            var target = null;
            
            if ( this.posMouse_1 ) {
                if ( this.posMouse_1.x && this.posMouse_1.y ) {
                    origin = {};
                    origin.x = this.posMouse_1.x - offset.x;
                    origin.y = this.posMouse_1.y - offset.y;
                    this.imageDotYellow.draw( origin.x, origin.y );
                }
            }
            
            if ( this.posMouse_2 ) {
                if ( this.posMouse_2.x && this.posMouse_2.y ) {
                    target = {};
                    target.x = this.posMouse_2.x - offset.x;
                    target.y = this.posMouse_2.y - offset.y;
                    this.imageDotYellow.draw( target.x, target.y );
                }
            }
            
            /** /
            if ( origin != null && target != null ) {
            
                var speed = 200;
                var gravity = 400;
                var angle = Math.atan2( ( target.y - origin.y ), ( target.x - origin.x ) );
                //console.log( (angle).toDeg() );
                
                var x = 0;
                var y = 0;
                
                var t = 0;
                for ( var i = 0; i < (100/0.05); i++ ) {
                    t += 0.05;
                    x = ( speed * Math.cos(angle) ) * t;
                    y = ( ( speed * Math.sin(angle) ) * t ) + ( 0.5 * gravity * ( t * t ) );
                    this.imageDotBlue.draw( ( origin.x + x ), ( origin.y + y  ) );
                    //console.log(x, y);
                }
                
            }
            /**/
            
            /** /
            if ( origin != null && target != null ) {
            
                var distance =  origin.x - target.x;
                var speed = 200;
                var gravity = 400;
                
                var angle = Math.atan( ( gravity * distance / (speed * speed) ) ) * 0.5;
                //var angle = Math.asin( ( gravity * distance / (speed * speed) ) ) * 0.5; // can return NaN
                
                var x = 0;
                var y = 0;
                
                var t = 0;
                for ( var i = 0; i < (100/0.05); i++ ) {
                    t += 0.05;
                    x = ( speed * Math.cos(angle) ) * t;
                    y = ( ( speed * Math.sin(angle) ) * t ) + ( 0.5 * gravity * ( t * t ) );
                    this.imageDotBlue.draw( ( origin.x + x ), ( origin.y + y  ) );
                    //console.log(x, y);
                }
                
                //this is only necessary why the enemy tank is facing left
                //o -= 180;
                
            }
            /**/
            
            /** /
            if ( origin != null && target != null ) {
                
                var distance = ( target.x - origin.x );
                var maxHeight = 40;
                
                var vertex = {};
                vertex.x = ( origin.x + ( distance / 2 ) );
                vertex.y = origin.y - maxHeight;
                this.imageDotYellow.draw( vertex.x, vertex.y );
                
                var speed = 200;
                var gravity = 400;
                var angle = Math.atan2( ( vertex.y - origin.y ), ( vertex.x - origin.x ) );
                
                // initial velocity = Math.sqrt( ( distance * gravity ) / ( sin(angel) * 2 ) )
                
                var x = 0;
                var y = 0;
                
                var t = 0;
                for ( var i = 0; i < (100/0.05); i++ ) {
                    t += 0.05;
                    x = ( speed * Math.cos(angle) ) * t;
                    y = ( ( speed * Math.sin(angle) ) * t ) + ( 0.5 * gravity * ( t * t ) );
                    this.imageDotBlue.draw( ( origin.x + x ), ( origin.y + y  ) );
                    //console.log(x, y);
                }
                
            }
            /**/
            
        },
        
    });
    
    // Subclass the default loader
    MyLoader = ig.Loader.extend({
        draw: function() {}
    });
    
    
    //
    // --------------------------------------------------------------------------
    // Initialize the Game
    // --------------------------------------------------------------------------
    //
    var width = window.innerWidth;
    var height = window.innerHeight;
    ig.main( '#canvas', GameStage, 1, 300, 180, 3, MyLoader );
});
